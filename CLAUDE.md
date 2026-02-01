# CogCommit

Document your AI-assisted development with **Cognitive Commits** — the unit of work between git commits, showing the conversation that shaped the code.

## Architecture

Monorepo structure with shared packages:

```
cogcommit/
├── apps/
│   ├── cli/                    # CLI tool (cogcommit command)
│   │   └── src/
│   │       ├── index.ts        # CLI entry point
│   │       ├── parser/         # JSONL log parsing
│   │       ├── storage/        # SQLite with better-sqlite3
│   │       ├── sync/           # Cloud sync (push/pull)
│   │       ├── studio/         # Local dashboard (React + Hono)
│   │       └── config/         # Config paths (~/.cogcommit/)
│   │
│   └── web/                    # Next.js web platform (cogcommit.com)
│       └── app/
│           ├── (marketing)/    # Landing, features, docs
│           ├── (dashboard)/    # Authenticated commit browser
│           └── (auth)/         # Login, OAuth callback
│
├── packages/
│   ├── types/                  # @cogcommit/types - shared TypeScript types
│   ├── supabase/               # @cogcommit/supabase - client & queries
│   └── ui/                     # @cogcommit/ui - shared React components
│
└── docs/                       # Documentation
```

## Data Model

### CognitiveCommit

```typescript
{
  id: string;              // UUID
  gitHash: string | null;  // Links to git commit (if closed by commit)
  closedBy: "git_commit" | "session_end" | "explicit";
  startedAt: Date;
  closedAt: Date;
  sessions: Session[];     // Supports parallel Claude sessions
  parallel: boolean;       // True if sessions overlapped
  filesRead: string[];     // Paths only
  filesChanged: string[];  // Paths with diffs
  source: ConversationSource; // Agent that produced the conversation
}

// Supported sources (currently only claude_code is implemented)
type ConversationSource = "claude_code" | "cursor" | "antigravity" | "codex" | "opencode";
```

### Commit Closure

A cognitive commit closes when:
1. **Git commit** — Natural boundary, links directly to hash
2. **Session end** — Work done but uncommitted (exploratory, abandoned)
3. **Explicit close** — User manually marks boundary

### Storage Paths

- **Local database**: `~/.cogcommit/global/data.db` — all projects in one SQLite DB
- **Auth tokens**: `~/.cogcommit/auth.json` — GitHub OAuth tokens

### Environment Variables

- `COGCOMMIT_SUPABASE_URL` — Supabase project URL
- `COGCOMMIT_SUPABASE_ANON_KEY` — Supabase anonymous key

---

## Key Files

| File | Purpose |
|------|---------|
| `apps/cli/src/index.ts` | CLI entry point with all commands |
| `apps/cli/src/parser/extractor.ts` | Core parsing state machine |
| `apps/cli/src/storage/schema.ts` | Database schema + migrations |
| `apps/cli/src/sync/auth.ts` | GitHub OAuth PKCE flow |
| `apps/cli/src/studio/server.ts` | Local dashboard Hono server |
| `apps/web/app/(dashboard)/` | Web platform dashboard pages |
| `packages/types/src/index.ts` | Shared type definitions |
| `packages/supabase/src/client.ts` | Supabase client factory |

---

## Design System

### Colors

| Token | Usage |
|-------|-------|
| `--chronicle-blue` | Primary action, links, current selection |
| `--chronicle-green` | Git hashes, success states, committed work |
| `--chronicle-amber` | File changed indicators, uncommitted work |
| `--chronicle-purple` | Parallel session indicators |

### LocalStorage Keys

| Key | Usage |
|-----|-------|
| `cogcommit-font-size` | User's preferred font size |
| `cogcommit-sidebar-width` | Sidebar width in pixels |
| `cogcommit-sidebar-collapsed` | Sidebar collapsed state |

---

## Critical: Flexbox Scroll Bug

**This is the most common issue when working on UI.**

Flexbox layouts with `overflow-y-auto` children won't create independent scroll contexts if the root can expand. The whole page scrolls instead of individual panels.

### The Fix

```tsx
// Root - fixed to viewport, no page scroll
<div className="h-screen bg-bg flex flex-col overflow-hidden">
  <Header />
  <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
    {/* Panels with independent scroll */}
  </div>
</div>
```

**Key rules:**
- Root: `h-screen overflow-hidden` (NOT `min-h-screen`)
- Flex containers: `style={{ minHeight: 0 }}` to allow children to shrink
- Scroll containers: `style={{ flex: '1 1 0%', minHeight: 0, overflowY: 'auto' }}`
