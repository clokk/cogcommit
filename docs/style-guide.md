# CogCommit Style Guide

## Design Philosophy

**"Dusty Dark Aesthetic"** - A distinctive, archival aesthetic that rejects generic design patterns. The interface should feel like a time machine for code: professional, readable, and intentionally different from typical developer tools. The warm brown + muted accent combination creates a comfortable, readable interface that doesn't fatigue the eyes during long sessions reviewing conversations.

- **The Void is Warm**: Rich warm blacks, not cold or pure black
- **Typography is Distinctive**: Serif body text as an intentional choice
- **Motion is Restrained**: Maximum 2 animation types, no micro-interactions
- **Colors are Dusty & Semantic**: Muted, desaturated accents that blend cohesively—never saturated Tailwind defaults

## Color Palette

### Backgrounds

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | #0d0b0a | Main background with radial vignette |
| `--panel` | #181614 | Cards, panels, left sidebar |
| `--panel-alt` | #1e1b18 | Right pane, alternate panels |

### Primary Accent

| Token | Hex | Usage |
|-------|-----|-------|
| `--accent` | #e07b39 | Primary action buttons, links |
| `--accent-hover` | #c66a2d | Hover state for accent |

### Semantic Colors (Dusty Variants)

All semantic colors are intentionally desaturated to create a cohesive, muted aesthetic.

| Token | Hex | Usage |
|-------|-----|-------|
| `--commit-closed` / `chronicle-green` | #5a9a7a | Git commit hashes, success states, approvals (dusty sage) |
| `--commit-open` / `chronicle-amber` | #b8923a | Uncommitted work, file changes, warnings (dusty amber) |
| `--user-accent` / `chronicle-blue` | #4f7d8d | User message bubbles, selection rings (dusty blue) |
| `--parallel` / `chronicle-purple` | #8a7aab | Parallel session indicators, badges (dusty lavender) |
| `chronicle-red` | #b85a5a | Rejections, errors, destructive actions (dusty red) |

### Badge Color Palette

Project and source badges use muted inline hex values rather than Tailwind defaults:

| Color | Background | Text | Usage |
|-------|------------|------|-------|
| Muted purple | `bg-[#8a7aab]/20` | `text-[#a090c0]` | Cursor, misc badges |
| Muted blue | `bg-[#5a8a9a]/20` | `text-[#6a9aaa]` | Claude, API sources |
| Muted green | `bg-[#5a9a7a]/20` | `text-[#6aaa8a]` | Codex, success badges |
| Muted amber | `bg-[#b8923a]/20` | `text-[#c8a24a]` | OpenCode, warning badges |
| Muted pink | `bg-[#a07080]/20` | `text-[#b08090]` | Misc category badges |
| Muted cyan | `bg-[#5a8a8a]/20` | `text-[#6a9a9a]` | Antigravity, active states |
| Muted yellow | `bg-[#a09050]/20` | `text-[#b0a060]` | Misc category badges |
| Muted indigo | `bg-[#6a7a9a]/20` | `text-[#7a8aaa]` | Misc category badges |

### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--text` | #e8e4df | Primary text, conversation content |
| `--muted` | #a39e97 | Secondary text, timestamps, metadata |
| `--subtle` | #6d6862 | Tertiary text, placeholders |

## Typography

| Font | Usage |
|------|-------|
| **Source Serif 4** | UI text, conversation content, navigation - distinctive serif choice |
| **Commit Mono** | Git hashes, file paths, code snippets, timestamps |

### Hierarchy

- Primary content uses `--text` color
- Timestamps and metadata use `--muted`
- Placeholders and disabled states use `--subtle`

## Layout

### Split Pane (Desktop)

```
┌──────────────┬─┬─────────────────────────────┐
│ Commits  [◀] │▌│  Conversation               │
│              │▌│                             │
│  (resizable) │▌│  (flex-1)                   │
└──────────────┴─┴─────────────────────────────┘
```

- Left pane: `bg-panel`, resizable (200-600px), collapsible to 48px
- Resizer: 4px draggable divider, highlights on hover/drag
- Right pane: `bg-panel-alt`, flex to fill
- App root: Radial vignette from `--bg` to black

### Sidebar States

**Expanded**: Shows full commit list with collapse button (◀)
**Collapsed**: 48px strip with mini commit indicators and expand button (▶)

### Scroll Containers

```tsx
// Root - fixed to viewport, no page scroll
<div className="h-screen app-root flex flex-col overflow-hidden">
  <Header />
  <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
    {/* Left panel - resizable, collapsible */}
    <div style={{ width: sidebarCollapsed ? 48 : sidebarWidth }}>...</div>
    {/* Resizer */}
    <div className="w-1 cursor-col-resize" onMouseDown={handleMouseDown} />
    {/* Right panel */}
    <div className="flex-1 overflow-hidden">
      <DetailView />
    </div>
  </div>
</div>
```

**Key rules:**
- Root: `h-screen overflow-hidden` (NOT `min-h-screen`)
- Flex containers: `style={{ minHeight: 0 }}` to allow children to shrink
- Scroll containers: `style={{ flex: '1 1 0%', minHeight: 0, overflowY: 'auto' }}`

### User Preferences (localStorage)

| Key | Type | Default | Purpose |
|-----|------|---------|---------|
| `cogcommit-sidebar-width` | number | 384 | Sidebar width in pixels |
| `cogcommit-sidebar-collapsed` | boolean | false | Sidebar collapsed state |
| `cogcommit-font-size` | number | 16 | Conversation font size (12-20px) |

## Component Patterns

### Cognitive Commit Card

```tsx
<div className={`border-l-2 ${hasGitHash ? 'border-commit-closed' : 'border-commit-open'} pl-4 py-3`}>
  <div className="flex items-center gap-2 text-sm">
    <span className="font-mono text-commit-closed">[abc123]</span>
    <span className="text-muted">12 prompts</span>
  </div>
</div>
```

### Turn (User)

```tsx
<div className="bg-user-accent/5 border-l-2 border-user-accent pl-4 py-2 my-2">
  <span className="text-sm font-medium text-blue-400">User</span>
  <p className="text-zinc-200">{content}</p>
</div>
```

### Turn (Assistant)

```tsx
<div className="bg-zinc-900/50 border-l-2 border-zinc-700 pl-4 py-2 my-2">
  <span className="text-sm font-medium text-muted">Assistant</span>
  <p className="text-zinc-200">{content}</p>
</div>
```

### Git Hash

```tsx
<span className="font-mono text-commit-closed">[{hash.slice(0, 7)}]</span>
```

### Uncommitted Indicator

```tsx
<span className="font-mono text-commit-open">[uncommitted]</span>
```

### Font Size Controls

Located in the turn navigation bar at bottom of conversation view:

```tsx
<div className="flex items-center gap-1 border border-zinc-700 rounded">
  <button onClick={decreaseFontSize}>
    <span className="text-xs font-bold">A</span>
  </button>
  <span className="text-xs font-mono">{fontSize}</span>
  <button onClick={increaseFontSize}>
    <span className="text-sm font-bold">A</span>
  </button>
</div>
```

Available sizes: 12, 14, 16, 18, 20px (default: 16px)

### Compact Header

The conversation header is condensed to 2 rows:

```
Row 1: [project] [abc123] · 232 prompts · 15 files  [/ search] [Delete]
Row 2: Click to add title...
```

- Stats inline with metadata using dot separators
- Search input expands on focus (w-36 → w-48)
- Reduced padding (p-4 instead of p-6)

### Tool-Only Groups

Consecutive assistant turns with only tool calls (no text) are grouped into a single compact row:

```tsx
<div className="rounded-lg p-3 border-l-2 bg-zinc-900/30 border-zinc-700">
  <div className="text-xs text-zinc-500">6 tool calls</div>
  <div className="flex flex-wrap gap-1">
    {toolCalls.map(tc => (
      <button className="px-2 py-0.5 text-xs font-mono bg-zinc-800">{tc.name}</button>
    ))}
  </div>
</div>
```

- Groups consecutive tool-only turns to save vertical space
- Each tool pill is clickable to expand details
- Shows count of tools in the group

### Item Navigation

Navigation uses "items" (visual groups) instead of raw turns:

```
◀  [ 3 / 15 ]  ▶   User
```

- Fixed-width counter (`w-32 text-center`) keeps arrows stationary
- Tool groups count as 1 item
- `j/k` navigates items, `J/K` skips to user messages
- Item type shown separately (User/Agent/N tools)

## Animations

We use a restrained animation palette with Framer Motion for skeleton loading states:

### Permitted Animations

| Animation | Library | Duration | Usage |
|-----------|---------|----------|-------|
| `slide-in-panel` | CSS | 0.2s | Detail panel entrance when selecting commit |
| `expand-accordion` | CSS | 0.2s | Tool call expansion |
| `shimmer` | Framer Motion | 1.5s | Skeleton loading gradient sweep |
| `stagger-children` | Framer Motion | 0.08s delay | Sequential card appearance |
| `animate-pulse` | Tailwind | 2s | Fallback skeleton pulse |

### Framer Motion Skeleton Animations

**Shimmer Effect** - A subtle gradient sweep across skeleton elements:

```tsx
import { motion } from "framer-motion";

export function Shimmer() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute inset-y-0 w-full"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)",
        }}
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
      />
    </div>
  );
}
```

**Stagger Animation** - Cards fade in sequentially:

```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

// Usage
<motion.div variants={containerVariants} initial="hidden" animate="visible">
  {items.map((item) => (
    <motion.div key={item.id} variants={cardVariants}>
      {/* Card content */}
    </motion.div>
  ))}
</motion.div>
```

### Skeleton Placeholders

Use `bg-subtle/40` with `animate-pulse` for skeleton elements:

```tsx
<div className="h-5 w-24 bg-subtle/40 rounded animate-pulse" />
<div className="h-5 w-3/4 bg-subtle/40 rounded animate-pulse" />
```

### Animation Guidelines

- **DO**: Use shimmer + stagger for skeleton loading states
- **DO**: Keep shimmer opacity subtle (7% white on dark backgrounds)
- **DO**: Use `animate-pulse` as a fallback/complement to shimmer
- **DON'T**: Add hover animations or micro-interactions
- **DON'T**: Use loading spinners (prefer skeleton loaders)
- **DON'T**: Animate content that's already loaded

```css
/* Applied via classes */
.animate-slide-in { /* Detail panels */ }
.animate-expand { /* Accordion sections */ }
```

## Anti-Slop Design Principles

### Typography

- **DO**: Use serif body text (Source Serif 4) as a distinctive choice
- **DON'T**: Default to Inter, Roboto, or system sans-serif
- **WHY**: Serif typography signals intentionality and creates archival feel

### Colors

- **DO**: Use dusty, desaturated colors for all semantic accents
- **DO**: Use warm brown backgrounds with muted accent combinations
- **DON'T**: Use saturated Tailwind defaults (`blue-500`, `red-400`, `emerald-500`)
- **DON'T**: Use bright neons, cold grays, or pure colors
- **WHY**: Dusty palette creates cohesion and doesn't fatigue eyes during long sessions

### Motion

- **DO**: Maximum 2 animation types, both functional
- **DON'T**: Add hover animations, loading spinners, or micro-interactions
- **WHY**: Motion should serve function, not decoration

### Visual Effects

- **DO**: Subtle radial vignette on app background
- **DON'T**: Drop shadows, gradient buttons, glassmorphism
- **WHY**: Depth should be implied, not forced

### General

- **DO**: Leave intentional whitespace, let typography breathe
- **DON'T**: Fill every pixel, add decorative elements
- **WHY**: Restraint is the defining characteristic

## Key Files

### CLI Studio (Local Viewer)

| File | Purpose |
|------|---------|
| `src/studio/frontend/styles/tailwind.css` | CSS variables, animations, utility classes |
| `src/studio/frontend/index.html` | Font loading (Source Serif 4, Commit Mono) |
| `tailwind.config.js` | Tailwind theme extensions |
| `src/studio/frontend/App.tsx` | Main layout with app-root |
| `src/studio/frontend/components/CommitDetail.tsx` | Detail view with slide-in animation |
| `src/studio/frontend/components/TurnView.tsx` | Turn display with accordion animation |

### Web Dashboard

| File | Purpose |
|------|---------|
| `packages/ui/src/Shimmer.tsx` | Reusable shimmer animation component |
| `packages/ui/src/CommitCardSkeleton.tsx` | Single card skeleton with shimmer + motion |
| `packages/ui/src/CommitListSkeleton.tsx` | List skeleton with stagger animation |
| `apps/web/app/(dashboard)/dashboard/loading.tsx` | Route transition loading state |
| `apps/web/app/(dashboard)/dashboard/DashboardClient.tsx` | Client component with loading state |
