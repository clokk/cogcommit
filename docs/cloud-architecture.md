# CogCommit Cloud Architecture

## Overview

Transform cogcommit from local-only to cloud-synced, following the git/github model:
- `cogcommit` CLI = local tool (like git)
- Cloud backend = sync/backup (like github)
- Conversations become portable across machines

## Stack: Supabase

| Component | Choice | Why |
|-----------|--------|-----|
| **Database** | Supabase (PostgreSQL) | Row-level security, real-time subscriptions, great DX |
| **Auth** | Supabase Auth + GitHub OAuth | Built-in GitHub provider, enables future integrations |
| **Storage** | Supabase Storage (S3-backed) | Integrated with auth, CDN delivery for screenshots |
| **Real-time** | Supabase Realtime | WebSocket-based for continuous sync |
| **API** | PostgREST + Edge Functions | Auto-generated REST, TypeScript edge functions |

**Alternatives considered:**
- Cloudflare D1: No built-in auth, still beta
- PlanetScale: No auth/storage, overkill for this scale
- AWS: Complex setup, poor DX
- Fly.io + Litestream: More ops work, DIY auth

## Sync Model

### Continuous (default)
Background sync like Dropbox:
- Daemon triggers sync on new commits
- WebSocket for real-time updates from other machines
- Debounced (500ms) to batch rapid changes

### Push-on-demand
Manual sync like git push:
- `cogcommit push` / `cogcommit pull`
- Useful for offline work or controlled sync

### Conflict Resolution
Last-write-wins with versions:
- Each record has `version` counter
- Higher version wins, or later `updated_at` if equal
- Soft deletes (tombstones) for 30 days

## Schema

> **IMPORTANT**: The relation tables are named `sessions` and `turns`, NOT `cognitive_sessions` or `cognitive_turns`. This has caused bugs when writing Supabase queries. See `docs/dashboard-architecture.md` for details.

### Cloud (PostgreSQL)

```sql
-- User and machine tracking
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  github_username TEXT NOT NULL,
  github_id TEXT NOT NULL,
  analytics_opt_in BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  machine_id TEXT NOT NULL,
  name TEXT,
  last_sync_at TIMESTAMPTZ,
  sync_cursor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, machine_id)
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  name TEXT NOT NULL,
  local_path TEXT,
  remote_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Cloud cognitive commits (extended from local)
CREATE TABLE cognitive_commits (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  project_id UUID REFERENCES projects(id),
  origin_machine_id UUID REFERENCES machines(id),

  -- Original fields
  git_hash TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ NOT NULL,
  closed_by TEXT NOT NULL,
  parallel BOOLEAN DEFAULT FALSE,
  files_read JSONB,
  files_changed JSONB,
  source TEXT DEFAULT 'claude_code',
  project_name TEXT,

  -- Curation fields
  published BOOLEAN DEFAULT FALSE,
  hidden BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  title TEXT,

  -- Sync metadata
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft delete

  -- Encryption (future)
  encrypted BOOLEAN DEFAULT FALSE,
  encryption_key_id TEXT
);

-- Sessions and turns tables
-- IMPORTANT: These are named 'sessions' and 'turns', NOT 'cognitive_sessions'/'cognitive_turns'
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  commit_id UUID NOT NULL REFERENCES cognitive_commits(id),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE turns (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id),
  role TEXT NOT NULL,
  content TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  model TEXT,
  tool_calls JSONB,
  triggers_visual BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Visuals follow same pattern
-- (include user_id, version, updated_at, deleted_at)

-- Row-level security
ALTER TABLE cognitive_commits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own commits"
  ON cognitive_commits FOR ALL
  USING (user_id = auth.uid());
```

### Local SQLite (v6 migration)

```sql
-- Sync metadata columns
ALTER TABLE cognitive_commits ADD COLUMN cloud_id TEXT;
ALTER TABLE cognitive_commits ADD COLUMN sync_status TEXT DEFAULT 'pending';
ALTER TABLE cognitive_commits ADD COLUMN cloud_version INTEGER DEFAULT 0;
ALTER TABLE cognitive_commits ADD COLUMN local_version INTEGER DEFAULT 1;
ALTER TABLE cognitive_commits ADD COLUMN last_synced_at TEXT;

-- Indexes for sync queries
CREATE INDEX IF NOT EXISTS idx_commits_sync_status ON cognitive_commits(sync_status);
CREATE INDEX IF NOT EXISTS idx_commits_cloud_id ON cognitive_commits(cloud_id);
```

## CLI Commands

### Auth
```bash
cogcommit login              # GitHub OAuth (opens browser)
cogcommit logout             # Clear local tokens
cogcommit whoami             # Show current user
```

### Sync
```bash
cogcommit push               # Push pending commits to cloud
cogcommit push --dry-run     # Preview what would be pushed
cogcommit push --force       # Re-push all commits
cogcommit push --retry       # Retry failed commits
cogcommit pull               # Pull new commits from cloud
cogcommit sync               # Bidirectional sync
cogcommit sync --status      # Show sync state
```

### Data Management
```bash
cogcommit stats              # Show commit/session/turn statistics
cogcommit export             # Export commits to JSON or Markdown
cogcommit search <query>     # Full-text search through conversations
cogcommit prune --before <date>  # Delete old commits locally
```

### Config
```bash
cogcommit config set storage cloud
cogcommit config set continuous-sync true
cogcommit config get storage
```

### Analytics
```bash
cogcommit analytics          # View local stats
cogcommit analytics --opt-in # Opt in to aggregate analytics
```

## Security & Privacy

### Launch (Server-side encryption)
- Supabase default encryption: AES-256 at rest, TLS in transit
- Row-level security ensures users only access their own data
- GitHub OAuth for trusted authentication

### Future (E2E encryption)
Optional client-side encryption for privacy-conscious users:
- User sets encryption password
- Client-side AES-256-GCM encryption before upload
- Server only stores encrypted blobs
- Not in scope for initial launch

### Analytics (opt-in only)
- Aggregate metrics only: session counts, tool usage, avg turns
- No prompts, code, or file names uploaded
- Differential privacy noise for any public stats
- Local computation preferred, only aggregates shared

## File Structure

```
src/sync/
  index.ts        # Exports
  client.ts       # Supabase client wrapper
  auth.ts         # GitHub OAuth flow
  push.ts         # Push local changes to cloud
  pull.ts         # Pull cloud changes to local
  conflict.ts     # Conflict detection and resolution
  queue.ts        # Background sync queue
  visual-sync.ts  # Screenshot upload/download
  types.ts        # Sync-related types
```

## Implementation Phases

### Phase 0: Documentation ✅
- [x] Add cloud-architecture.md
- [x] Update vision.md with git/github framing

### Phase 1: Foundation ✅
- [x] Setup Supabase project (wiucvdinjmrcveoqbhjd.supabase.co)
- [x] Create cloud schema with RLS policies
- [x] Add v6 migration for sync metadata
- [x] Create src/sync/ module structure

### Phase 2: Authentication ✅
- [x] `cogcommit login` with GitHub OAuth PKCE flow
- [x] Token storage in `~/.cogcommit/auth.json`
- [x] Token refresh handling
- [x] `cogcommit logout` and `cogcommit whoami`

### Phase 3: Sync Core ✅
- [x] Push sync implementation (tested with 666 commits)
- [x] UUID conversion for non-UUID session/turn IDs
- [x] `cogcommit push` command working
- [x] `cogcommit sync --status` command working
- [ ] Pull sync implementation (needs testing)
- [ ] Conflict detection and resolution

### Phase 4: Continuous Sync
- [ ] Background sync worker in daemon
- [ ] WebSocket subscription for real-time updates
- [ ] Sync status display in Studio UI

### Phase 5: Visual Sync
- [ ] Screenshot upload on capture
- [ ] Lazy download on view in Studio
- [ ] Local caching with TTL

### Phase 6: Analytics
- [ ] Local stats computation
- [ ] Opt-in UI in settings
- [ ] Aggregate upload for opted-in users

### Phase 7: Polish
- [ ] Error handling and retry logic
- [ ] Offline support and queue persistence
- [ ] Conflict resolution UI in Studio
- [ ] Documentation and onboarding

## Usage Limits

### Free Tier
- **250 commits** synced to cloud
- **50 MB storage**
- Unlimited local usage

### What Counts
Only "valid" commits count against limits:
- Has at least 1 turn
- First message is not a warmup (Claude Code internal)

### Enforcement
- Push automatically filters warmup/empty commits (marks as synced locally)
- When at limit, only most recent commits sync
- Usage bar shown in both CLI studio and web dashboard

### Upgrade Path (Future)
- Pro tier: Unlimited commits, 1GB storage
- Team tier: Shared repositories, collaboration

## Cost Estimate

| Tier | Database | Storage | Cost | Fits |
|------|----------|---------|------|------|
| Free | 500MB | 1GB | $0 | Most developers |
| Pro | 8GB | 100GB | $25/mo | Heavy users, teams |

## Key Files to Modify

| File | Changes |
|------|---------|
| `src/storage/schema.ts` | Add v6 migration with sync columns |
| `src/storage/db.ts` | Add sync-aware CRUD, conflict detection |
| `src/config/index.ts` | Add cloud config fields, auth token management |
| `src/daemon/processor.ts` | Trigger sync queue after commit close |
| `src/index.ts` | Add login, logout, whoami, push, pull, sync commands |

## Verification Checklist

- [x] `cogcommit login` completes OAuth flow
- [x] `cogcommit whoami` shows GitHub username
- [x] `cogcommit push` uploads pending commits (tested: 666 commits)
- [ ] On another machine, `cogcommit pull` downloads them
- [ ] Continuous sync: new commit auto-syncs
- [ ] Screenshots sync correctly
- [ ] `cogcommit analytics` shows local stats
- [ ] Opt-in analytics only uploads aggregates
- [ ] Conflicts resolved with last-write-wins
