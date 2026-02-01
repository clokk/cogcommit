import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

interface Commit {
  id: string;
  git_hash: string | null;
  started_at: string;
  closed_at: string;
  closed_by: string;
  parallel: boolean;
  files_changed: string[];
  title: string | null;
  project_name: string | null;
  source: string;
  sessions: {
    id: string;
    turns: { id: string }[];
  }[];
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getProjectColor(name: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    { bg: "bg-purple-500/20", text: "text-purple-400" },
    { bg: "bg-blue-500/20", text: "text-blue-400" },
    { bg: "bg-emerald-500/20", text: "text-emerald-400" },
    { bg: "bg-orange-500/20", text: "text-orange-400" },
    { bg: "bg-pink-500/20", text: "text-pink-400" },
    { bg: "bg-cyan-500/20", text: "text-cyan-400" },
  ];
  return colors[Math.abs(hash) % colors.length];
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch commits with sessions and turns count
  const { data: commits, error } = await supabase
    .from("commits")
    .select(
      `
      id,
      git_hash,
      started_at,
      closed_at,
      closed_by,
      parallel,
      files_changed,
      title,
      project_name,
      source,
      sessions (
        id,
        turns (id)
      )
    `
    )
    .eq("user_id", user?.id)
    .is("deleted_at", null)
    .eq("hidden", false)
    .order("closed_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to fetch commits:", error);
  }

  const typedCommits = (commits as Commit[]) || [];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <h1 className="text-2xl font-bold text-white">Your Commits</h1>
        <p className="text-zinc-400 mt-1">
          {typedCommits.length} cognitive commits synced from your development
          sessions
        </p>
      </header>

      {/* Commits list */}
      <div className="flex-1 overflow-y-auto p-6">
        {typedCommits.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-zinc-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-white mb-2">
              No commits yet
            </h2>
            <p className="text-zinc-400 max-w-md mx-auto mb-6">
              Install the Agentlogs CLI and sync your Claude Code conversations
              to see them here.
            </p>
            <a
              href="/docs"
              className="inline-flex px-4 py-2 bg-chronicle-blue text-black rounded-lg font-medium hover:bg-chronicle-blue/90 transition-colors"
            >
              Get Started
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {typedCommits.map((commit) => {
              const turnCount = commit.sessions.reduce(
                (sum, s) => sum + s.turns.length,
                0
              );
              const projectColor = commit.project_name
                ? getProjectColor(commit.project_name)
                : null;

              return (
                <Link
                  key={commit.id}
                  href={`/dashboard/commits/${commit.id}`}
                  className="block rounded-lg p-4 bg-zinc-800/50 hover:bg-zinc-800 border-l-2 transition-colors cursor-pointer"
                  style={{
                    borderColor: commit.git_hash ? "#34d399" : "#fbbf24",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Project badge */}
                      {commit.project_name && projectColor && (
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-medium rounded mb-2 ${projectColor.bg} ${projectColor.text}`}
                        >
                          {commit.project_name}
                        </span>
                      )}

                      {/* Git hash */}
                      <div className="flex items-center gap-2">
                        {commit.git_hash ? (
                          <span className="font-mono text-sm text-chronicle-green">
                            [{commit.git_hash.substring(0, 7)}]
                          </span>
                        ) : (
                          <span className="font-mono text-sm text-chronicle-amber">
                            [uncommitted]
                          </span>
                        )}
                        {commit.parallel && (
                          <span
                            className="text-purple-400 text-xs"
                            title="Parallel sessions"
                          >
                            ||
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <div className="text-sm text-zinc-300 mt-1 truncate">
                        {commit.title || "Untitled conversation"}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                        <span>{turnCount} turns</span>
                        <span>
                          {commit.sessions.length} session
                          {commit.sessions.length !== 1 ? "s" : ""}
                        </span>
                        {commit.files_changed.length > 0 && (
                          <span>{commit.files_changed.length} files</span>
                        )}
                      </div>

                      {/* Time */}
                      <div className="text-xs text-zinc-600 mt-1">
                        {formatTime(commit.closed_at)}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
