import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ConversationView from "@/components/ConversationView";
import { getSourceStyle, formatAbsoluteTime, getProjectColor } from "@cogcommit/ui";
import type { Turn, ToolCall } from "@cogcommit/types";

interface DbTurn {
  id: string;
  role: string;
  content: string | null;
  timestamp: string;
  model: string | null;
  tool_calls: string | null;
}

interface DbSession {
  id: string;
  started_at: string;
  ended_at: string;
  turns: DbTurn[];
}

interface DbCommit {
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
  sessions: DbSession[];
}

/**
 * Transform database turn to app Turn type
 */
function transformTurn(dbTurn: DbTurn): Turn {
  let toolCalls: ToolCall[] | undefined;

  if (dbTurn.tool_calls) {
    try {
      const parsed = JSON.parse(dbTurn.tool_calls);
      toolCalls = parsed.map((tc: { id: string; name: string; input?: Record<string, unknown>; result?: string; isError?: boolean }) => ({
        id: tc.id,
        name: tc.name,
        input: tc.input || {},
        result: tc.result,
        isError: tc.isError,
      }));
    } catch {
      // Ignore parse errors
    }
  }

  return {
    id: dbTurn.id,
    role: dbTurn.role as "user" | "assistant",
    content: dbTurn.content || "",
    timestamp: dbTurn.timestamp,
    model: dbTurn.model || undefined,
    toolCalls,
  };
}

export default async function CommitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: commit, error } = await supabase
    .from("cognitive_commits")
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

  const typedCommit = commit as DbCommit;
  const sourceStyle = getSourceStyle(typedCommit.source);
  const projectColor = typedCommit.project_name
    ? getProjectColor(typedCommit.project_name)
    : null;

  // Flatten and transform all turns
  const allTurns: Turn[] = typedCommit.sessions.flatMap((s) =>
    s.turns.map(transformTurn)
  );

  const turnCount = allTurns.length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-zinc-800 px-6 py-4 bg-panel-alt">
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

          {typedCommit.project_name && projectColor && (
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded ${projectColor.bg} ${projectColor.text}`}
            >
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
          {formatAbsoluteTime(typedCommit.closed_at)}
        </p>
      </header>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <ConversationView turns={allTurns} />
        </div>
      </div>
    </div>
  );
}
