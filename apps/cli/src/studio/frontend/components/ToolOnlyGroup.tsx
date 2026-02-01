import React, { useState, forwardRef } from "react";
import { type Turn } from "../api";

interface ToolOnlyGroupProps {
  turns: Turn[];
  searchTerm?: string;
}

/**
 * Get tool summary for hover tooltip
 */
function getToolSummary(tc: Turn["toolCalls"][0]): string {
  const input = tc.input;
  if ("file_path" in input) return String(input.file_path);
  if ("command" in input) {
    const cmd = String(input.command);
    return cmd.length > 60 ? cmd.substring(0, 60) + "..." : cmd;
  }
  if ("pattern" in input) return `pattern: ${input.pattern}`;
  if ("query" in input) return `query: ${input.query}`;
  if ("url" in input) return String(input.url);
  if (tc.isError) return "Error";
  return tc.name;
}

/**
 * Format tool input for display
 */
function formatToolInput(input: Record<string, unknown>): string {
  if ("command" in input) {
    return `command: ${input.command}`;
  }
  if ("file_path" in input) {
    return `file: ${input.file_path}`;
  }
  if ("pattern" in input) {
    return `pattern: ${input.pattern}`;
  }
  return JSON.stringify(input, null, 2);
}

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  result?: string;
  isError?: boolean;
  turnId: string;
}

/**
 * Displays a group of consecutive tool-only assistant turns in a compact row
 */
const ToolOnlyGroup = forwardRef<HTMLDivElement, ToolOnlyGroupProps>(
  function ToolOnlyGroup({ turns, searchTerm }, ref) {
    const [expandedToolId, setExpandedToolId] = useState<string | null>(null);

    // Flatten all tool calls from all turns
    const allToolCalls: ToolCall[] = turns.flatMap((turn) =>
      (turn.toolCalls || []).map((tc) => ({
        ...tc,
        turnId: turn.id,
      }))
    );

    if (allToolCalls.length === 0) return null;

    return (
      <div
        ref={ref}
        className="rounded-lg p-3 border-l-2 bg-zinc-900/30 border-zinc-700"
      >
        {/* Compact header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-zinc-500">
            {allToolCalls.length} tool call{allToolCalls.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Tool pills in a wrapping row */}
        <div className="flex flex-wrap gap-1">
          {allToolCalls.map((tc) => (
            <button
              key={tc.id}
              title={getToolSummary(tc)}
              onClick={() =>
                setExpandedToolId(expandedToolId === tc.id ? null : tc.id)
              }
              className={`px-2 py-0.5 text-xs font-mono rounded cursor-pointer transition-colors
                ${
                  tc.isError
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }
                ${expandedToolId === tc.id ? "ring-1 ring-chronicle-blue" : ""}`}
            >
              {tc.name}
            </button>
          ))}
        </div>

        {/* Expanded tool detail */}
        {expandedToolId && (
          <div className="mt-2 animate-expand">
            {allToolCalls
              .filter((tc) => tc.id === expandedToolId)
              .map((tc) => (
                <div
                  key={tc.id}
                  className="bg-zinc-800/50 rounded p-3 text-xs font-mono"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`font-medium ${
                        tc.isError ? "text-red-400" : "text-chronicle-green"
                      }`}
                    >
                      {tc.name}
                    </span>
                    {tc.isError && (
                      <span className="px-1.5 py-0.5 text-xs rounded bg-red-400/20 text-red-400">
                        error
                      </span>
                    )}
                  </div>

                  {/* Input */}
                  {tc.input && Object.keys(tc.input).length > 0 && (
                    <details className="mt-1" open>
                      <summary className="text-zinc-500 cursor-pointer hover:text-zinc-400">
                        Input
                      </summary>
                      <pre className="mt-1 p-2 bg-zinc-900 rounded text-zinc-400 overflow-x-auto">
                        {formatToolInput(tc.input)}
                      </pre>
                    </details>
                  )}

                  {/* Result */}
                  {tc.result && (
                    <details className="mt-1">
                      <summary className="text-zinc-500 cursor-pointer hover:text-zinc-400">
                        Result
                      </summary>
                      <pre className="mt-1 p-2 bg-zinc-900 rounded text-zinc-400 overflow-x-auto max-h-40">
                        {tc.result.length > 500
                          ? tc.result.substring(0, 500) + "..."
                          : tc.result}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    );
  }
);

export default ToolOnlyGroup;
