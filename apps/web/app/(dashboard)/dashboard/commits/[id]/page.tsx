import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Turn {
  id: string;
  role: string;
  content: string | null;
  timestamp: string;
  model: string | null;
  tool_calls: string | null;
}

interface Session {
  id: string;
  started_at: string;
  ended_at: string;
  turns: Turn[];
}

interface Commit {
  id: string;
  git_hash: string | null;
  started_at: string;
  closed_at: string;
  closed_by: string;
  parallel: boolean;
  files_read: string[];
  files_changed: string[];
  title: string | null;
  project_name: string | null;
  source: string;
  sessions: Session[];
}

function formatModelName(model?: string | null): string {
  if (!model) return "Agent";
  if (model.includes("opus-4-5")) return "Opus 4.5";
  if (model.includes("opus-4")) return "Opus 4";
  if (model.includes("opus")) return "Opus";
  if (model.includes("sonnet-4")) return "Sonnet 4";
  if (model.includes("3-5-sonnet") || model.includes("3.5-sonnet"))
    return "Sonnet 3.5";
  if (model.includes("sonnet")) return "Sonnet";
  if (model.includes("haiku")) return "Haiku";
  return model.split("-").pop() || "Agent";
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getSourceStyle(source?: string): {
  bg: string;
  text: string;
  label: string;
} {
  switch (source) {
    case "claude_code":
      return { bg: "bg-blue-500/20", text: "text-blue-400", label: "Claude" };
    case "cursor":
      return {
        bg: "bg-purple-500/20",
        text: "text-purple-400",
        label: "Cursor",
      };
    case "antigravity":
      return {
        bg: "bg-cyan-500/20",
        text: "text-cyan-400",
        label: "Antigravity",
      };
    case "codex":
      return {
        bg: "bg-emerald-500/20",
        text: "text-emerald-400",
        label: "Codex",
      };
    case "opencode":
      return {
        bg: "bg-orange-500/20",
        text: "text-orange-400",
        label: "OpenCode",
      };
    default:
      return { bg: "bg-zinc-500/20", text: "text-zinc-400", label: "Unknown" };
  }
}

export default async function CommitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: commit, error } = await supabase
    .from("commits")
    .select(
      `
      *,
      sessions (
        *,
        turns (*)
      )
    `
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !commit) {
    notFound();
  }

  const typedCommit = commit as Commit;
  const sourceStyle = getSourceStyle(typedCommit.source);
  const turnCount = typedCommit.sessions.reduce(
    (sum, s) => sum + s.turns.length,
    0
  );

  // Flatten all turns for rendering
  const allTurns = typedCommit.sessions.flatMap((s) => s.turns);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/dashboard"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            &larr; Back
          </Link>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded ${sourceStyle.bg} ${sourceStyle.text}`}
          >
            {sourceStyle.label}
          </span>

          {typedCommit.project_name && (
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-500/20 text-purple-400">
              {typedCommit.project_name}
            </span>
          )}

          {typedCommit.git_hash ? (
            <span className="font-mono text-chronicle-green text-xs">
              [{typedCommit.git_hash}]
            </span>
          ) : (
            <span className="font-mono text-chronicle-amber text-xs">
              [uncommitted]
            </span>
          )}

          <span className="text-zinc-600">|</span>
          <span className="text-zinc-500">{turnCount} turns</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-500">
            {typedCommit.files_changed.length} files changed
          </span>
        </div>

        <h1 className="text-xl font-semibold text-white mt-2">
          {typedCommit.title || "Untitled conversation"}
        </h1>

        <p className="text-sm text-zinc-500 mt-1">
          {formatTime(typedCommit.closed_at)}
        </p>
      </header>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {allTurns.map((turn) => (
            <div
              key={turn.id}
              className={`rounded-lg p-4 border-l-2 ${
                turn.role === "user"
                  ? "bg-chronicle-blue/5 border-chronicle-blue"
                  : "bg-zinc-900/50 border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-sm font-medium ${
                    turn.role === "user" ? "text-blue-400" : "text-zinc-400"
                  }`}
                >
                  {turn.role === "user" ? "User" : formatModelName(turn.model)}
                </span>
                <span className="text-xs text-zinc-600">
                  {new Date(turn.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {turn.content && (
                <div className="text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {turn.content}
                </div>
              )}

              {turn.tool_calls && (
                <div className="mt-2">
                  {(() => {
                    try {
                      const tools = JSON.parse(turn.tool_calls);
                      return (
                        <div className="flex flex-wrap gap-1">
                          {tools.map((tc: { id: string; name: string }) => (
                            <span
                              key={tc.id}
                              className="px-2 py-0.5 text-xs font-mono rounded bg-zinc-800 text-zinc-400"
                            >
                              {tc.name}
                            </span>
                          ))}
                        </div>
                      );
                    } catch {
                      return null;
                    }
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
