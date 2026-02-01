# CogCommit

> Document your AI-assisted development with cognitive commits.

## The Problem

You have valuable conversations with AI coding agents every day. Where do they go?

They disappear into `~/.claude/projects/` — scattered JSONL files that become impossible to search, reference, or learn from. The conversation that shaped your code is lost the moment the session ends.

Git tracks *what* changed. Nothing tracks *how it got built*.

## The Solution

CogCommit captures **cognitive commits** — the unit of work between git commits that shows the reasoning, exploration, and decisions that led to the code.

- **Local-first**: Your commits are stored locally in SQLite, always accessible
- **Cloud-synced**: Push to the cloud to access from any machine
- **Linked to code**: Cognitive commits are tied to the git commits they produced

```
cogcommit import      # Import all Claude Code history
cogcommit dashboard   # Browse your cognitive commits
cogcommit push        # Sync to cloud
```

## What is a Cognitive Commit?

The **Cognitive Commit** is the new unit of work. It captures everything between git commits:

| Git | Cognitive Commit |
|-----|------------------|
| Many file changes → one commit | Many turns → one cognitive commit |
| Commit message = summary | First prompt = intent |
| `git diff` shows what changed | Turns show how it evolved |

**What closes a Cognitive Commit:**
1. **Git commit** - links directly to a hash
2. **Session end** - work done but not committed
3. **Explicit close** - user manually marks boundary

## The Data Model

### CognitiveCommit

```
CognitiveCommit
├── id
├── gitHash (nullable)     # Links to git commit if one was made
├── closedBy               # "git_commit" | "session_end" | "explicit"
├── startedAt / closedAt
├── sessions[]             # One or more Claude sessions
├── filesRead[]            # Paths referenced
└── filesChanged[]         # Paths with diffs
```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Parser    │ →   │   Storage   │ →   │  Dashboard  │
│             │     │             │     │             │
│ Reads JSONL │     │   SQLite    │     │  React UI   │
│ from Claude │     │   + API     │     │  to browse  │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Global mode (default):** All projects in one database at `~/.cogcommit/`

**Project mode:** Scoped to single project at `.cogcommit/`

## CLI

```bash
# Import Claude Code history
cogcommit import             # All projects (global)
cogcommit import --project   # Current project only

# Browse cognitive commits
cogcommit dashboard          # Open local web UI

# Cloud sync
cogcommit login              # GitHub OAuth
cogcommit push               # Push to cloud
cogcommit pull               # Pull from cloud
```

## What Gets Stored

| Data | Stored |
|------|--------|
| User prompts | ✓ |
| Assistant responses | ✓ |
| Tool calls (edits, reads, bash) | ✓ |
| File diffs | ✓ |
| Git commit hashes | ✓ |
| Timestamps | ✓ |

## Who This Is For

Anyone who uses Claude Code and wants to:
- **Search** past conversations ("How did I implement auth last month?")
- **Learn** from your own collaboration patterns
- **Reference** the thinking behind code decisions
- **Build** a record of your AI-assisted work

---

## Current Features

### Core
- Parse Claude Code session logs into cognitive commits
- SQLite storage with full conversation history
- Dashboard UI for browsing and curating commits
- Screenshot capture for visual context
- Multi-agent support (Claude Code, Cursor, Antigravity, Codex, OpenCode)

### Cloud Sync
- `cogcommit login` — GitHub OAuth authentication
- `cogcommit push` / `cogcommit pull` — Manual sync
- Cross-machine access — Your cognitive commits anywhere

### Web Platform
- Browse synced commits at cogcommit.com
- Filter by project, source, or date
- Same GitHub account as CLI

## Future Possibilities

These are ideas, not commitments. The core value is capturing cognitive commits.

### Near-term
- Full-text search across all conversations
- Better diff visualization
- Session labels and tags
- Conflict resolution UI

### Further out
- Public sharing (opt-in portfolios)
- Team/org mode with shared repositories
- End-to-end encryption option
- Aggregate analytics (opt-in)

---

## Technical Details

### Claude Code Log Format

**Location:** `~/.claude/projects/<project-path>/<session-uuid>.jsonl`

Each line is a JSON object with:
- `type`: "user", "assistant", "summary"
- `message`: Content with role, tool calls, timestamps
- `uuid`/`parentUuid`: Session threading

**Retention:** Files persist ~3 weeks. Import regularly.

### Storage Schema

SQLite with migrations. Current version: v6.

**Local tables:** `cognitive_commits`, `sessions`, `turns`, `visuals`, `daemon_state`

**Sync columns (v6):** `cloud_id`, `sync_status`, `cloud_version`, `local_version`, `last_synced_at`

Indices on: git hash, timestamps, project name, sync status

### Key Files

| File | Purpose |
|------|---------|
| `apps/cli/src/parser/extractor.ts` | Core parsing state machine |
| `apps/cli/src/storage/db.ts` | Database operations |
| `apps/cli/src/studio/frontend/App.tsx` | Local dashboard UI |
| `apps/cli/src/index.ts` | CLI entry point |
| `apps/web/` | Web platform (Next.js) |

---

## The Name

**CogCommit** — cognitive commits from your AI-assisted development.

- A **cognitive commit** captures the reasoning, exploration, and decisions that led to the code
- The intellectual work, not just the transcript
- "Cog" = cognition/thinking, "Commit" = unit of work (like git commit)
