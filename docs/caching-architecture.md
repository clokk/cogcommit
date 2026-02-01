# Dashboard Caching Architecture

This document explains how the CogCommit dashboard uses a multi-layer caching strategy to deliver fast, responsive user experiences. If you're new to caching concepts, don't worry—we'll build up from the basics.

## Why Caching Matters

Every time a user loads the dashboard, we need to fetch their commits from the database. Without caching, this means:

1. User clicks refresh
2. Browser sends request to our server
3. Server queries the Supabase database
4. Database processes the query and returns data
5. Server transforms the data and sends it back
6. Browser receives the data and renders it

This round-trip can take 500ms to 2 seconds depending on network conditions and database load. Caching lets us skip some of these steps by remembering data we've already fetched.

## The Four Layers

Our caching strategy has four layers, each solving a different problem:

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Skeleton Loaders + Client-Side Loading            │
│  "Show animated skeleton instantly while data loads"        │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Server Cache (React cache())                      │
│  "Request-level deduplication"                              │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Client Cache (React Query)                        │
│  "Remember API results in the browser for 5 minutes"        │
├─────────────────────────────────────────────────────────────┤
│  Layer 4: Cache Invalidation                                │
│  "Clear stale data when things change"                      │
└─────────────────────────────────────────────────────────────┘
```

Let's explore each layer in detail.

---

## Layer 1: Skeleton Loaders + Client-Side Data Fetching

**Problem:** When a page is loading, users see a blank screen. This feels slow and broken. Server-side data fetching blocks the HTML response, preventing any UI from appearing until data is ready.

**Solution:** Show animated skeleton UI immediately using client-side data fetching. The page renders a loading state while React Query fetches data in the background.

### The Architecture

```
apps/web/app/(dashboard)/dashboard/
├── page.tsx           ← Server component (auth only, no data fetch)
├── DashboardClient.tsx ← Client component (fetches data, shows loading)
└── loading.tsx        ← Shown during route transitions
```

### Why Client-Side Data Fetching?

We moved data fetching from server to client to achieve **instant loading states**:

**Before (Server-Side):**
```
User refreshes → Server auth check → Server data fetch → HTML sent → UI appears
                 └─────────── Blocking delay (no UI) ──────────┘
```

**After (Client-Side):**
```
User refreshes → Server auth check → HTML with skeleton sent → Client fetches data
                                     └─ UI appears immediately ─┘
```

### Page Structure

**`page.tsx`** - Only handles authentication:

```tsx
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null; // Layout redirects to login

  // Pass only auth info - NO data fetching here
  return (
    <DashboardClient
      userId={user.id}
      userName={userName}
      avatarUrl={avatarUrl}
    />
  );
}
```

**`DashboardClient.tsx`** - Client component with loading state:

```tsx
"use client";

export default function DashboardClient({ userId, userName, avatarUrl }) {
  // React Query handles data fetching with loading state
  const { data: commits = [], isLoading } = useCommits({ project: selectedProject });
  const { data: projectsData } = useProjects();

  // Show skeleton immediately while loading
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return <DashboardView commits={commits} ... />;
}
```

### The Skeleton Components

We created reusable skeleton components in the UI package with Framer Motion animations:

**`CommitCardSkeleton.tsx`** - Matches the layout of a real CommitCard with shimmer effect:

```tsx
export default function CommitCardSkeleton() {
  return (
    <motion.div
      variants={cardVariants}
      className="relative rounded-lg p-3 border-l-2 border-subtle bg-bg/50 overflow-hidden"
    >
      <Shimmer />
      <div className="h-5 w-24 bg-subtle/40 rounded animate-pulse" />
      <div className="h-5 w-3/4 bg-subtle/40 rounded mt-1 animate-pulse" />
      {/* ... */}
    </motion.div>
  );
}
```

**`CommitListSkeleton.tsx`** - Renders multiple card skeletons with stagger animation:

```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

export default function CommitListSkeleton({ count = 8 }) {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {Array.from({ length: count }).map((_, i) => (
        <CommitCardSkeleton key={i} />
      ))}
    </motion.div>
  );
}
```

### Shimmer Effect

The `Shimmer` component provides a subtle animated gradient sweep:

```tsx
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

### Why This Matters

Skeleton loaders create **perceived performance**. Even if the actual load time is the same, users feel like the app is faster because something happens immediately. Studies show users are more patient when they can see progress.

---

## Layer 2: Server-Side Request Memoization

**Problem:** During a single page render, the same data might be requested multiple times by different components.

**Solution:** Use React's `cache()` to deduplicate requests within a single render.

### How It Works

React provides a `cache()` function that memoizes async functions for the duration of a single request. If the same function is called multiple times with the same arguments during a render, it only executes once.

**`lib/data/commits.ts`:**

```tsx
import { cache } from "react";

export const getCachedCommits = cache(
  async (userId: string, project?: string | null) => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("cognitive_commits")
      .select("*, sessions(*)")
      .eq("user_id", userId);

    return transformAndFilter(data);
  }
);
```

### Why Not `unstable_cache`?

Next.js also provides `unstable_cache` for persistent server-side caching across requests. However, it has a limitation: functions inside `unstable_cache` run in a static context without access to request-specific data like cookies.

Since our Supabase client needs cookies for authentication, we can't use `unstable_cache` directly. Instead, we rely on:

1. **React's `cache()`** for request-level deduplication
2. **React Query** for cross-request caching on the client

### The Request Flow

**Multiple components requesting the same data:**
```
Component A calls getCachedCommits(userId)
  → cache() executes function → Database query → Returns data

Component B calls getCachedCommits(userId)
  → cache() returns memoized result → No database query

Component C calls getCachedCommits(userId)
  → cache() returns memoized result → No database query
```

All three components get the same data from a single database query.

---

## Layer 3: Client-Side Caching

**Problem:** When users navigate away and come back, or switch between projects, they have to wait for fresh API calls.

**Solution:** Cache API responses in the browser with React Query.

### How It Works

React Query is a library that manages server state in React applications. It handles caching, background refetching, and cache invalidation automatically.

**Setting up the provider (`components/providers/QueryProvider.tsx`):**

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({ children }) {
  // Create QueryClient inside useState to avoid recreating on every render
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000,      // 5 minutes
          gcTime: 30 * 60 * 1000,        // 30 minutes
          refetchOnWindowFocus: true,    // Refresh when tab regains focus
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### Key Concepts

**Stale Time (5 minutes):** How long data is considered "fresh." During this time, React Query returns cached data without refetching.

**GC Time (30 minutes):** How long unused data stays in memory before being garbage collected.

**Refetch on Window Focus:** When users switch to another tab and come back, React Query checks if data is stale and refetches in the background.

### The useCommits Hook

**`lib/hooks/useCommits.ts`:**

```tsx
// Query keys should be consistent and predictable
export const commitKeys = {
  all: ["commits"],
  list: (project?: string | null) =>
    [...commitKeys.all, "list", { project: project ?? "all" }],
};

export function useCommits({ project }) {
  return useQuery({
    queryKey: commitKeys.list(project),
    queryFn: async () => {
      const res = await fetch(`/api/commits?project=${project || ""}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

### Optimistic Updates

When users edit a commit title, we don't wait for the API—we update the UI immediately:

```tsx
export function useUpdateCommitTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commitId, title }) => {
      return fetch(`/api/commits/${commitId}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      });
    },

    // Optimistically update before API responds
    onMutate: async ({ commitId, title }) => {
      // Cancel any in-flight refetches
      await queryClient.cancelQueries({ queryKey: commitKeys.all });

      // Snapshot current data for rollback
      const previousData = queryClient.getQueryData(commitKeys.all);

      // Optimistically update the cache
      queryClient.setQueryData(commitKeys.all, (old) =>
        old.map((c) => c.id === commitId ? { ...c, title } : c)
      );

      return { previousData };
    },

    // Rollback on error
    onError: (err, variables, context) => {
      queryClient.setQueryData(commitKeys.all, context.previousData);
    },
  });
}
```

This creates a snappy, app-like feel where changes appear instantly.

---

## Layer 4: Cache Invalidation

**Problem:** Cached data becomes stale when users make changes.

**Solution:** React Query handles cache invalidation automatically through mutations.

### How React Query Manages Staleness

React Query's cache invalidation is built into the mutation flow:

```tsx
export function useUpdateCommitTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commitId, title }) => {
      return fetch(`/api/commits/${commitId}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      });
    },

    // After mutation completes (success or failure)
    onSettled: () => {
      // Mark all commit queries as stale and refetch
      queryClient.invalidateQueries({ queryKey: commitKeys.all });
    },
  });
}
```

### The Invalidation Flow

When a user edits a commit title:

```
1. User types new title
2. Optimistic update shows change immediately
3. API request sent to server
4. Server updates database
5. onSettled triggers
6. React Query invalidates all commit queries
7. Background refetch gets fresh data
8. UI updates with confirmed data
```

### Optional: Server-Side Path Revalidation

For cases where you need to force a full page refresh (rare), we provide a server action:

**`lib/data/revalidate.ts`:**

```tsx
"use server";

import { revalidatePath } from "next/cache";

export async function revalidateDashboard() {
  revalidatePath("/dashboard");
}
```

This clears the Next.js router cache, forcing a fresh server render on the next navigation.

### HTTP Cache Headers

We also set cache headers on API responses for browser/CDN caching:

```tsx
return NextResponse.json(
  { commits },
  {
    headers: {
      "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
    },
  }
);
```

Breaking this down:
- `private` - Only cache in the user's browser, not CDNs (data is user-specific)
- `max-age=60` - Cache is fresh for 60 seconds
- `stale-while-revalidate=300` - For the next 5 minutes, serve stale data while fetching fresh data in the background

---

## How It All Works Together

Let's trace through a complete user journey:

### 1. First Visit / Hard Refresh
```
User navigates to /dashboard
  → Middleware checks for auth cookie (fast, no API call)
  → Server renders page with DashboardClient
  → Browser receives HTML, hydrates
  → DashboardClient shows skeleton immediately (isLoading = true)
  → React Query fetches /api/commits in background
  → Data arrives, skeleton replaced with actual content
  → React Query stores data in client cache (5min staleTime)
```

### 2. Client-Side Navigation
```
User navigates from /settings to /dashboard
  → loading.tsx shows skeleton during route transition
  → DashboardClient mounts
  → React Query checks cache
  → If fresh: renders immediately from cache
  → If stale: shows cached data, refetches in background
```

### 3. Navigate Away and Back (within 5 minutes)
```
User goes to /settings, then back to /dashboard
  → React Query has cached data (still fresh)
  → DashboardClient renders instantly (no loading state)
  → No API request needed
```

### 4. User Edits a Title
```
User changes a commit title
  → useUpdateCommitTitle fires
  → UI updates immediately (optimistic update)
  → API call happens in background
  → Server updates database
  → Mutation's onSettled invalidates React Query cache
  → Background refetch gets fresh data from server
```

### 5. Window Focus After 5+ Minutes
```
User switches to another tab, comes back after 6 minutes
  → React Query detects data is stale
  → Shows cached data immediately
  → Triggers background refetch
  → UI updates silently when fresh data arrives
```

---

## Middleware Optimization

The middleware is optimized to avoid blocking the page render:

```tsx
export async function updateSession(request: NextRequest) {
  // Quick check: does a session cookie exist? (no API call)
  const hasSessionCookie = request.cookies.has("sb-access-token") ||
    Array.from(request.cookies.getAll()).some(c => c.name.includes("auth-token"));

  // Only redirect if NO cookie exists
  if (isProtectedRoute && !hasSessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Full auth verification happens in the layout, not middleware
  return response;
}
```

This ensures the page can start rendering immediately while auth verification happens in parallel.

---

## Common Gotchas

### 1. Cache Key Mismatch
If your cache keys don't match exactly, you'll get cache misses:

```tsx
// These are DIFFERENT cache keys:
commitKeys.list("my-project")
commitKeys.list("My-Project")  // Different case = different key
```

Always normalize inputs (lowercase, trim whitespace) before using them in keys.

### 2. Forgetting to Invalidate
If you add a new mutation that modifies data, remember to:
1. Call `revalidateUserCommits()` in the API route
2. Call `queryClient.invalidateQueries()` in the mutation

### 3. Server-Side Blocking
Avoid fetching data in server components if you want instant loading states. Move data fetching to client components with React Query.

### 4. Stale Closure in Callbacks
When using callbacks in mutations, capture current values:

```tsx
// Wrong - selectedCommitId might be stale
const handleTitleChange = () => {
  mutate({ commitId: selectedCommitId, title: newTitle });
};

// Right - include in dependency array
const handleTitleChange = useCallback(() => {
  mutate({ commitId: selectedCommitId, title: newTitle });
}, [selectedCommitId, mutate]);
```

---

## File Reference

| File | Purpose |
|------|---------|
| `packages/ui/src/CommitCardSkeleton.tsx` | Single card skeleton with shimmer |
| `packages/ui/src/CommitListSkeleton.tsx` | List of card skeletons with stagger |
| `packages/ui/src/Shimmer.tsx` | Reusable shimmer animation component |
| `apps/web/app/(dashboard)/dashboard/page.tsx` | Server component (auth only) |
| `apps/web/app/(dashboard)/dashboard/DashboardClient.tsx` | Client component with loading state |
| `apps/web/app/(dashboard)/dashboard/loading.tsx` | Route transition loading state |
| `apps/web/lib/data/commits.ts` | Server-cached data fetching |
| `apps/web/lib/data/revalidate.ts` | Cache invalidation actions |
| `apps/web/components/providers/QueryProvider.tsx` | React Query setup |
| `apps/web/lib/hooks/useCommits.ts` | Client-side data hooks |

---

## Further Reading

- [Next.js Caching Documentation](https://nextjs.org/docs/app/building-your-application/caching)
- [React Query Documentation](https://tanstack.com/query/latest/docs/react/overview)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [HTTP Cache-Control Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
