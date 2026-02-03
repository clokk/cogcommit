# Public Sharing Feature

**Status: Implemented** (February 2026)

## Summary

Enable users to publish cognitive commits publicly, making them accessible via shareable links. Everything private by default, with explicit publish action required.

**Core Flow:**
```
Dashboard -> Select commit -> "Publish" -> Confirmation -> Copy link -> Share
```

**URLs:**
- `/c/[slug]` - Public commit viewer (no auth)
- `/u/[username]` - Public profile page (optional, Phase 2)

---

## Phase 1: Database & Types

### 1.1 Supabase Migration

Add columns to `cognitive_commits`:

```sql
ALTER TABLE cognitive_commits ADD COLUMN public_slug TEXT UNIQUE;
ALTER TABLE cognitive_commits ADD COLUMN published_at TIMESTAMPTZ;
CREATE INDEX idx_commits_public_slug ON cognitive_commits(public_slug) WHERE public_slug IS NOT NULL;
```

### 1.2 RLS Policies for Public Access

```sql
-- Anyone can view published commits (no auth required)
CREATE POLICY "public_read_published_commits"
  ON cognitive_commits FOR SELECT
  USING (published = true AND public_slug IS NOT NULL);

-- Same for sessions of published commits
CREATE POLICY "public_read_published_sessions"
  ON sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cognitive_commits
      WHERE cognitive_commits.id = sessions.commit_id
        AND cognitive_commits.published = true
    )
  );

-- Same for turns
CREATE POLICY "public_read_published_turns"
  ON turns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      JOIN cognitive_commits ON cognitive_commits.id = sessions.commit_id
      WHERE sessions.id = turns.session_id
        AND cognitive_commits.published = true
    )
  );
```

### 1.3 Local SQLite Migration (v8)

```typescript
// apps/cli/src/storage/schema.ts
{
  version: 8,
  sql: `
    ALTER TABLE cognitive_commits ADD COLUMN public_slug TEXT;
    ALTER TABLE cognitive_commits ADD COLUMN published_at TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_commits_public_slug ON cognitive_commits(public_slug);
  `,
}
```

### 1.4 Type Updates

**File:** `packages/types/src/index.ts`

```typescript
// Add to CognitiveCommit interface
publicSlug?: string;
publishedAt?: string;

// Add to DbCommit (Supabase row)
public_slug: string | null;
published_at: string | null;
```

### 1.5 Transform Updates

**File:** `packages/supabase/src/transforms.ts`

Add to `transformCommit()`:
```typescript
publicSlug: db.public_slug ?? undefined,
publishedAt: db.published_at ?? undefined,
```

---

## Phase 2: API Endpoints

### 2.1 Publish Endpoint

**File:** `apps/web/app/api/commits/[id]/publish/route.ts` (new)

```typescript
// POST /api/commits/[id]/publish
// 1. Auth required
// 2. Verify user owns commit
// 3. Generate public_slug (nanoid, 8 chars) if not exists
// 4. Set published=true, published_at=now()
// 5. Return { slug, url }
```

### 2.2 Unpublish Endpoint

**File:** `apps/web/app/api/commits/[id]/unpublish/route.ts` (new)

```typescript
// POST /api/commits/[id]/unpublish
// 1. Auth required
// 2. Set published=false
// 3. PRESERVE public_slug (for re-publish)
// 4. Return { success: true }
```

### 2.3 Public Commit Fetch (No Auth)

**File:** `apps/web/app/api/public/commits/[slug]/route.ts` (new)

```typescript
// GET /api/public/commits/[slug]
// 1. NO auth required (public route)
// 2. Query commit by public_slug WHERE published=true
// 3. Include sessions/turns
// 4. Include author info (username, avatar from user_profiles)
// 5. Return PublicCommit or 404
```

### 2.4 Supabase Queries

**File:** `packages/supabase/src/queries.ts`

Add:
```typescript
export async function publishCommit(client, commitId): Promise<{ slug: string }>
export async function unpublishCommit(client, commitId): Promise<void>
export async function getPublicCommit(client, slug): Promise<PublicCommit | null>
```

---

## Phase 3: Dashboard UI

### 3.1 Publish Button in ConversationViewer Header

**File:** `packages/ui/src/ConversationViewer.tsx`

Add new props:
```typescript
interface ConversationViewerProps {
  // ... existing
  onPublish?: () => Promise<{ slug: string; url: string }>;
  onUnpublish?: () => Promise<void>;
}
```

Add button next to Export/Delete (following existing pattern):
- **Unpublished:** "Publish" button with globe icon
- **Published:** Dropdown with "Copy Link" + "Unpublish" options

### 3.2 Publish Confirmation Modal

Follow existing delete modal pattern (lines 721-746):

```tsx
{showPublishConfirm && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className="bg-panel rounded-lg p-6 max-w-md">
      <h3>Publish Commit?</h3>
      <p>This will make the conversation publicly accessible...</p>
      <div className="flex justify-end gap-3">
        <button>Cancel</button>
        <button className="bg-chronicle-blue">Publish</button>
      </div>
    </div>
  </div>
)}
```

### 3.3 Privacy Badge on CommitCard

**File:** `packages/ui/src/CommitCard.tsx`

Add badge (following existing badge pattern):
```tsx
{commit.published ? (
  <span className="px-2 py-0.5 text-xs font-medium rounded bg-chronicle-green/20 text-chronicle-green">
    Public
  </span>
) : null}  // Only show badge when public, private is default/implied
```

### 3.4 React Query Hooks

**File:** `apps/web/lib/hooks/useCommits.ts`

Add:
```typescript
export function usePublishCommit()
export function useUnpublishCommit()
```

With optimistic updates to commit list/detail caches.

### 3.5 Copy Link Functionality

After publish success, show toast or update button to "Copied!" state with the URL.

---

## Phase 4: Public Viewer Page

### 4.1 Public Route

**File:** `apps/web/app/c/[slug]/page.tsx` (new)

```typescript
// Server component
// 1. Fetch public commit via API
// 2. Return 404 if not found or not published
// 3. Render with marketing layout
// 4. Show author info in header
// 5. Use read-only ConversationViewer
```

### 4.2 Middleware Update

**File:** `apps/web/middleware.ts`

Allow `/c/*` routes without auth:
```typescript
const isPublicRoute = request.nextUrl.pathname.startsWith("/c/");
if (isPublicRoute) {
  return response; // Skip auth check
}
```

### 4.3 SEO Metadata

Add OpenGraph tags for sharing:
- Title: commit title or first prompt preview
- Description: "AI-assisted development conversation"
- Image: CogCommit og-image

### 4.4 Read-Only ConversationViewer

Either:
- Add `readOnly` prop to ConversationViewer (hides edit/delete)
- Or create lightweight `PublicConversationViewer` component

---

## Phase 5: Public Profile (Future)

**Deferred** - implement after core publish flow works.

- `/u/[username]` - list user's public commits
- Profile page with avatar, username, commit count
- Links from published commits to author profile

---

## Files Modified/Created

| File | Action |
|------|--------|
| `packages/types/src/index.ts` | Add `publicSlug`, `publishedAt` |
| `packages/supabase/src/transforms.ts` | Transform new fields |
| `packages/supabase/src/queries.ts` | Add publish/unpublish/getPublic queries |
| `packages/ui/src/ConversationViewer.tsx` | Add publish button + modal |
| `packages/ui/src/CommitCard.tsx` | Add privacy badge |
| `apps/cli/src/storage/schema.ts` | Add v8 migration |
| `apps/web/middleware.ts` | Allow `/c/*` public routes |
| `apps/web/app/api/commits/[id]/publish/route.ts` | **NEW** |
| `apps/web/app/api/commits/[id]/unpublish/route.ts` | **NEW** |
| `apps/web/app/api/public/commits/[slug]/route.ts` | **NEW** |
| `apps/web/app/c/[slug]/page.tsx` | **NEW** |
| `apps/web/lib/hooks/useCommits.ts` | Add mutation hooks |

---

## Implementation Status

All phases have been implemented and deployed:
- [x] Phase 1: Database & Types
- [x] Phase 2: API Endpoints
- [x] Phase 3: Dashboard UI
- [x] Phase 4: Public Viewer Page
- [ ] Phase 5: Public Profile (deferred to future iteration)

---

## Verification

1. **Publish flow**: Click publish -> confirm -> see "Public" badge + copy link
2. **Public access**: Open `/c/[slug]` in incognito -> see conversation (no login)
3. **Unpublish flow**: Click unpublish -> badge disappears -> `/c/[slug]` returns 404
4. **Re-publish**: Publish again -> same URL works (slug preserved)
5. **Auth**: Publish/unpublish endpoints require auth, public fetch doesn't

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Slug format | nanoid 8 chars | Short, URL-safe, collision-resistant |
| Slug on unpublish | Preserve | Same URL works if re-published |
| Privacy badge | Show only when public | Private is default/implied |
| Profile page | Defer to Phase 5 | Core publish flow first |
| Project visibility | Defer | Per-commit is sufficient for MVP |

---

## Required: Supabase Migration

You need to run this migration in Supabase:

```sql
-- Add public sharing columns
ALTER TABLE cognitive_commits ADD COLUMN public_slug TEXT UNIQUE;
ALTER TABLE cognitive_commits ADD COLUMN published_at TIMESTAMPTZ;
CREATE INDEX idx_commits_public_slug ON cognitive_commits(public_slug) WHERE public_slug IS NOT NULL;

-- RLS policy for public read access to published commits
CREATE POLICY "public_read_published_commits"
  ON cognitive_commits FOR SELECT
  USING (published = true AND public_slug IS NOT NULL);

-- RLS policy for public read access to sessions of published commits
CREATE POLICY "public_read_published_sessions"
  ON sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cognitive_commits
      WHERE cognitive_commits.id = sessions.commit_id
        AND cognitive_commits.published = true
    )
  );

-- RLS policy for public read access to turns of published commits
CREATE POLICY "public_read_published_turns"
  ON turns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      JOIN cognitive_commits ON cognitive_commits.id = sessions.commit_id
      WHERE sessions.id = turns.session_id
        AND cognitive_commits.published = true
    )
  );
```
