# CogCommit

> Document your AI-assisted development with cognitive commits.

A **cognitive commit** captures the reasoning, exploration, and decisions that led to the code — the intellectual work, not just the transcript.

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

## Web Platform

Visit [cogcommit.com](https://cogcommit.com) to browse your synced cognitive commits in the cloud.

## CLI Installation

```bash
npm install -g cogcommit
```

## Quick Start

```bash
# Import all your Claude Code history
cogcommit import

# Open the dashboard to browse conversations
cogcommit dashboard
```

## Cloud Sync

Sync your cognitive commits to the cloud:

```bash
# Authenticate with GitHub
cogcommit login

# Push commits to cloud
cogcommit push

# Pull commits from cloud
cogcommit pull
```

## Commands

### Import Sessions

```bash
# Import all Claude Code projects (default)
cogcommit import

# Clear existing data before importing
cogcommit import --clear

# Import from specific Claude project
cogcommit import --claude-path ~/.claude/projects/-Users-you-project
```

### Dashboard

```bash
# Start the local dashboard
cogcommit dashboard

# Custom port
cogcommit dashboard --port 3000

# Don't auto-open browser
cogcommit dashboard --no-open
```

### Cloud Sync

```bash
cogcommit login              # GitHub OAuth (opens browser)
cogcommit logout             # Clear local tokens
cogcommit whoami             # Show current user
cogcommit push               # Push pending commits to cloud
cogcommit pull               # Pull new commits from cloud
```

## Monorepo Structure

```
cogcommit/
├── apps/
│   ├── cli/                 # CLI tool
│   └── web/                 # Next.js web platform
├── packages/
│   ├── types/               # Shared TypeScript types
│   ├── supabase/            # Supabase client & queries
│   └── ui/                  # Shared UI components
└── docs/                    # Documentation
```

## Data Storage

Data is stored in:
- `~/.cogcommit/global/data.db` - SQLite database with commits, sessions, turns
- `~/.cogcommit/auth.json` - Authentication tokens

## License

MIT
