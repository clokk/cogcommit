# CogCommit CLI

The command-line interface for CogCommit.

## Development

### Prerequisites

- Node.js 18+
- pnpm 8+

### Building

```bash
# From repo root
pnpm build --filter=cogcommit

# Or from this directory
pnpm build
```

This runs two build steps:
1. `tsc` - Compiles TypeScript to `dist/`
2. `vite build` - Bundles the Studio frontend to `dist/studio/`

### Running Locally

```bash
# Run CLI directly
node dist/index.js --help

# Or use pnpm dev from repo root
pnpm dev --filter=cogcommit
```

### Testing the Studio Dashboard

```bash
# Import some data first
node dist/index.js import

# Start the dashboard
node dist/index.js dashboard
```

## Architecture

```
src/
├── index.ts              # CLI entry point
├── commands/             # Command modules (Commander.js)
│   ├── parse.ts          # parse, list, info commands
│   ├── init.ts           # init command
│   ├── watch.ts          # watch, stop, status, capture
│   ├── studio.ts         # dashboard command
│   ├── import.ts         # import command
│   ├── auth.ts           # login, logout, whoami
│   ├── sync.ts           # push, pull, sync
│   └── config.ts         # config, analytics
├── parser/               # JSONL log parsing
├── storage/              # SQLite database
│   ├── db.ts             # Database wrapper
│   ├── schema.ts         # Schema & migrations
│   └── repositories/     # Data access layer
├── sync/                 # Cloud sync (push/pull)
├── studio/               # Local dashboard (React + Hono)
│   ├── server.ts         # Hono API server
│   └── frontend/         # React app (bundled by Vite)
├── daemon/               # Background watcher
├── config/               # Configuration paths
├── models/               # Type definitions
└── utils/                # Utility functions (title generation, etc.)
```

## Database API

Uses the repository pattern for data access:

```typescript
const db = new CogCommitDB(projectPath);

// Commits
db.commits.get(id);
db.commits.getAll();
db.commits.insert(commit);
db.commits.update(id, { title: "New title" });
db.commits.delete(id);

// Sessions & Turns
db.sessions.getForCommit(commitId);
db.turns.getForSession(sessionId);

// Visuals
db.visuals.create(commitId, "screenshot", filePath);
db.visuals.getForCommit(commitId);

// Daemon State
db.daemonState.getLastActivity();
db.daemonState.getCurrentCommitId();
db.daemonState.setFilePosition(filePath, position);
```

## Cloud Sync Commands

### Free Tier Limits

Cloud sync has usage limits:
- **250 commits** synced to cloud
- **50 MB storage**

Local usage is unlimited. When pushing, only the most recent commits sync up to the limit.

**What's automatically filtered:**
- Warmup sessions (Claude Code internal)
- Commits with no turns (empty)

These don't count against your limit and aren't synced to cloud.

### Push Options

```bash
# Push with progress bar (default)
cogcommit push

# Verbose mode (shows each commit, disables progress bar)
cogcommit push --verbose

# Preview what would be pushed
cogcommit push --dry-run

# Force re-push all commits (resets sync status)
cogcommit push --force

# Retry previously failed commits
cogcommit push --retry
```

### Cloud Management

```bash
# Delete all your cloud data (requires confirmation)
cogcommit cloud clear

# Skip confirmation (for scripts)
cogcommit cloud clear --yes
```

## Import Command

The import command reads Claude Code session logs and converts them to cognitive commits.

### Smart Project Detection

Commits are automatically assigned to projects based on where file operations actually occurred, not just where the Claude session was started. This handles the common case of starting a session in one directory but working on files in another project.

**How it works:**
- File reads: 1 point each
- File edits/writes: 3 points each
- Highest-scoring project wins
- Falls back to Claude session directory if no file operations

**Example:** A session started in `claudeverse` but with most edits in `cogcommit` will be correctly tagged as a `cogcommit` commit.

### Import Options

```bash
cogcommit import                   # Import all Claude Code projects (default)
cogcommit import --project         # Import current project only (requires init)
cogcommit import --clear           # Clear existing commits before importing
cogcommit import --redetect        # Re-run project detection on existing commits
```

### Re-detecting Projects

If you have existing commits with incorrect project assignments, use `--redetect` to re-run the smart detection algorithm:

```bash
cogcommit import --redetect
```

This scans all existing commits and updates their project assignments based on the file operations recorded in each commit.

---

## Data Management Commands

### Statistics

```bash
cogcommit stats                    # Overall statistics
cogcommit stats --project myproj   # Project-specific stats
cogcommit stats --json             # JSON output
```

### Export

```bash
cogcommit export                           # JSON to stdout
cogcommit export -o backup.json            # Save to file
cogcommit export --format=markdown         # Markdown format
cogcommit export --project myproj --limit 10
```

### Search

```bash
cogcommit search "keyword"                 # Search all content
cogcommit search "error" --project myproj  # Filter by project
cogcommit search "API" --limit 50          # Limit results
```

### Prune

```bash
cogcommit prune --before 30d --dry-run     # Preview deletions
cogcommit prune --before 2024-01-01        # Delete before date
cogcommit prune --before 7d --project old  # Project-specific
cogcommit prune --before 90d --yes         # Skip confirmation
```

## Publishing

```bash
# Build and publish to npm
pnpm build
npm publish
```

The package is published as `cogcommit` on npm.
