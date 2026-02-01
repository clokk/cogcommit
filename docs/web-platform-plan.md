# CogCommit Web Platform Plan

> **STATUS: COMPLETED** - Web platform is live at cogcommit.com

## Overview

Deploy CogCommit as a web platform on Vercel with:
- **Marketing pages** - Landing, features, docs (public, SEO-friendly)
- **Dashboard** - Authenticated users view their cloud-synced commits (replaces "Studio")
- **GitHub OAuth** - Same auth as CLI via Supabase

## Architecture Decision

**Next.js 14 (App Router)** in a monorepo structure

| Choice | Why |
|--------|-----|
| Next.js over Vite+Hono | SSG/SSR for marketing SEO, native Vercel support, built-in auth middleware |
| Monorepo | Share types, Supabase client, and UI components between CLI and web |
| pnpm + Turborepo | Fast builds, dependency management, caching |

---

## Current Codebase (for reference)

```
src/
├── index.ts              # CLI entry (34KB) - commands: import, studio, login, push, pull
├── models/types.ts       # Core types: CognitiveCommit, Session, Turn, ToolCall, etc.
├── sync/                 # Supabase cloud sync (9 files)
│   ├── client.ts         # getSupabaseClient(), getAuthenticatedClient()
│   ├── auth.ts           # GitHub OAuth PKCE flow (port 54321)
│   ├── push.ts, pull.ts  # Sync operations
│   └── types.ts          # CloudCommit, AuthTokens, SyncResult
├── storage/              # SQLite with better-sqlite3
├── studio/               # Current local web UI
│   ├── frontend/         # React + Tailwind (App.tsx, CommitDetail.tsx, TurnView.tsx)
│   ├── routes/           # Hono API handlers
│   └── server.ts         # Hono server on port 4747
├── parser/               # Claude Code log parsing
└── daemon/               # Background watcher
```

---

## Target Directory Structure

```
agentlogs/
├── apps/
│   ├── cli/                    # Current CLI (moved from src/)
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts        # CLI entry
│   │       ├── parser/         # Log parsing
│   │       ├── storage/        # SQLite
│   │       ├── daemon/         # Background watcher
│   │       └── config/
│   │
│   └── web/                    # NEW: Next.js app
│       ├── package.json
│       ├── app/
│       │   ├── (marketing)/    # Public pages (no auth)
│       │   │   ├── page.tsx    # Landing
│       │   │   ├── features/page.tsx
│       │   │   └── docs/page.tsx
│       │   ├── (dashboard)/    # Auth required
│       │   │   ├── layout.tsx  # Dashboard shell
│       │   │   ├── page.tsx    # Commits list
│       │   │   ├── commits/[id]/page.tsx
│       │   │   └── settings/page.tsx
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx
│       │   │   └── callback/route.ts
│       │   └── api/
│       │       └── commits/route.ts
│       ├── components/
│       ├── lib/supabase/
│       └── middleware.ts
│
├── packages/
│   ├── types/                  # Shared TypeScript types
│   │   ├── package.json
│   │   └── src/index.ts        # CognitiveCommit, Session, Turn, etc.
│   ├── supabase/               # Shared Supabase client + queries
│   │   ├── package.json
│   │   └── src/
│   │       ├── client.ts       # Browser/server client creation
│   │       ├── queries.ts      # getCommits, getCommit, etc.
│   │       └── transforms.ts   # snake_case → camelCase
│   └── ui/                     # Shared React components
│       ├── package.json
│       └── src/
│           ├── CommitDetail.tsx
│           ├── TurnView.tsx
│           └── ToolOnlyGroup.tsx
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json                # Root workspace package
```

---

## Implementation Phases

### Phase 0: Document the Plan
1. Create `docs/web-platform-plan.md` with this full plan
   - Reference for future development
   - Onboarding context for contributors
   - Decision log for architecture choices

### Phase 1: Monorepo Setup
1. Create root `pnpm-workspace.yaml` and `turbo.json`
2. Create root `package.json` with workspace scripts
3. Extract `packages/types/` from `src/models/types.ts`
   - Types: CognitiveCommit, Session, Turn, ToolCall, ClosedBy, SyncStatus, etc.
4. Create `packages/supabase/` adapted from `src/sync/`
   - Browser client (for web)
   - Server client (for SSR)
   - Query functions (getCommits, getCommit)
   - Transform functions (snake_case → camelCase)
5. Move CLI to `apps/cli/`
   - Move: index.ts, parser/, storage/, daemon/, config/, sync/
   - Keep sync/ in CLI for now (CLI auth uses file-based tokens)
   - Update imports to use @agentlogs/types
   - Create apps/cli/package.json with CLI dependencies

### Phase 2: Next.js Scaffold
1. Initialize `apps/web/` with Next.js 14 App Router
   - `npx create-next-app@latest apps/web --typescript --tailwind --app --src-dir=false`
2. Set up Supabase SSR auth with @supabase/ssr
   - `lib/supabase/client.ts` - Browser client
   - `lib/supabase/server.ts` - Server client (cookies)
   - `middleware.ts` - Refresh session, protect /dashboard/*
3. Create route groups:
   - `(marketing)/` - Public layout with nav, footer
   - `(dashboard)/` - Auth-required layout with sidebar
   - `(auth)/` - Minimal layout for login/callback
4. Create auth pages:
   - `(auth)/login/page.tsx` - "Sign in with GitHub" button
   - `(auth)/callback/route.ts` - Exchange code for session

### Phase 3: Dashboard MVP
1. Create `packages/ui/` with ported components:
   - CommitDetail.tsx (30KB → adapt for cloud data)
   - TurnView.tsx (turn rendering with tool calls)
   - ToolOnlyGroup.tsx (grouped tool responses)
   - CommitCard.tsx (list item)
2. Build dashboard pages:
   - `(dashboard)/page.tsx` - Commits list with infinite scroll
   - `(dashboard)/commits/[id]/page.tsx` - Full commit detail
   - `(dashboard)/settings/page.tsx` - Account settings
3. Wire up data fetching:
   - Use @supabase/ssr for server components
   - TanStack Query for client-side mutations

### Phase 4: Marketing Pages
1. `(marketing)/page.tsx` - Landing page
   - Hero: "Document your AI-assisted development"
   - Features grid: Import, Sync, Share
   - CTA: Install CLI / Sign in
2. `(marketing)/features/page.tsx` - Feature deep-dive
3. `(marketing)/docs/page.tsx` - CLI install, usage, API reference

### Phase 5: Deploy
1. Create `vercel.json` for monorepo
2. Configure environment variables on Vercel
3. Update Supabase redirect URLs for production domain
4. Test full flow: login → dashboard → view commits

---

## Key Files to Create/Modify

### Phase 0 Files
| File | Action |
|------|--------|
| `docs/web-platform-plan.md` | Create - full implementation plan for reference |

### Phase 1 Files
| File | Action |
|------|--------|
| `pnpm-workspace.yaml` | Create - define apps/* and packages/* |
| `turbo.json` | Create - build/dev/lint pipelines |
| `package.json` | Create - root workspace with scripts |
| `packages/types/package.json` | Create - @agentlogs/types package |
| `packages/types/src/index.ts` | Create - extract from src/models/types.ts |
| `packages/supabase/package.json` | Create - @agentlogs/supabase package |
| `packages/supabase/src/client.ts` | Create - browser/server client factories |
| `packages/supabase/src/queries.ts` | Create - getCommits, getCommit functions |
| `packages/supabase/src/transforms.ts` | Create - DB → frontend type transforms |
| `apps/cli/package.json` | Create - agentlogs CLI package |
| `apps/cli/src/*` | Move - all current src/ contents |
| `apps/cli/tsconfig.json` | Create - CLI-specific config |

### Phase 2 Files
| File | Action |
|------|--------|
| `apps/web/package.json` | Create via create-next-app |
| `apps/web/app/layout.tsx` | Create - root layout |
| `apps/web/app/(marketing)/layout.tsx` | Create - public pages layout |
| `apps/web/app/(dashboard)/layout.tsx` | Create - auth-required layout |
| `apps/web/app/(auth)/login/page.tsx` | Create - GitHub OAuth login |
| `apps/web/app/(auth)/callback/route.ts` | Create - OAuth callback handler |
| `apps/web/lib/supabase/client.ts` | Create - browser client |
| `apps/web/lib/supabase/server.ts` | Create - server client with cookies |
| `apps/web/middleware.ts` | Create - session refresh + route protection |

### Phase 3 Files
| File | Action |
|------|--------|
| `packages/ui/package.json` | Create - @agentlogs/ui package |
| `packages/ui/src/CommitDetail.tsx` | Port from studio/frontend/components/ |
| `packages/ui/src/TurnView.tsx` | Port from studio/frontend/components/ |
| `packages/ui/src/CommitCard.tsx` | Port from studio/frontend/components/ |
| `apps/web/app/(dashboard)/page.tsx` | Create - commits list |
| `apps/web/app/(dashboard)/commits/[id]/page.tsx` | Create - commit detail |

### Phase 4-5 Files
| File | Action |
|------|--------|
| `apps/web/app/(marketing)/page.tsx` | Create - landing page |
| `apps/web/app/(marketing)/features/page.tsx` | Create - features page |
| `apps/web/app/(marketing)/docs/page.tsx` | Create - docs page |
| `vercel.json` | Create - monorepo deploy config |

---

## Auth Flow (Web)

```
1. User clicks "Sign in with GitHub"
2. → Supabase OAuth URL (same provider as CLI)
3. → GitHub authorizes
4. → Supabase callback
5. → /auth/callback exchanges code for session
6. → Session stored in httpOnly cookies
7. → Redirect to /dashboard
```

Middleware protects `/dashboard/*` routes - redirects to `/login` if no session.

---

## Data Transformation

Supabase uses snake_case, frontend uses camelCase:

```typescript
// packages/supabase/src/transforms.ts
export function transformCommit(db: DbCommit): CognitiveCommit {
  return {
    id: db.id,
    gitHash: db.git_hash,
    startedAt: db.started_at,
    closedAt: db.closed_at,
    closedBy: db.closed_by,
    sessions: db.sessions?.map(transformSession) ?? [],
    // ...
  }
}
```

---

## Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "pnpm turbo build --filter=web",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs"
}
```

**Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Verification

### After Phase 1 (Monorepo)
```bash
pnpm install                    # All workspaces resolve
pnpm build --filter=@agentlogs/types   # Types package builds
pnpm build --filter=cli         # CLI still compiles
node apps/cli/dist/index.js --help     # CLI runs
```

### After Phase 2 (Next.js Scaffold)
```bash
pnpm dev --filter=web           # Web app starts on localhost:3000
# Visit /login → redirects to Supabase OAuth
# Visit /dashboard (no session) → redirects to /login
```

### After Phase 3 (Dashboard)
```bash
# Login with GitHub
# Navigate to /dashboard → see commits list
# Click a commit → see detail view
# Same GitHub account works for CLI login
```

### After Phase 4-5 (Marketing + Deploy)
```bash
# Visit / → landing page loads (no auth required)
# Visit /features, /docs → content loads
# Vercel preview deploy succeeds
# Production domain configured
```

---

## Domain

**cogcommit.com** - Production domain for the web platform.
