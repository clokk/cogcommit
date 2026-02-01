"use client";

import React from "react";
import type { CognitiveCommit } from "@cogcommit/types";
import { formatTime, getProjectColor } from "./utils/formatters";

interface CommitCardProps {
  commit: CognitiveCommit;
  isSelected?: boolean;
  onClick?: () => void;
  showProjectBadge?: boolean;
}

function getFirstUserMessage(commit: CognitiveCommit): string | null {
  for (const session of commit.sessions) {
    for (const turn of session.turns) {
      if (turn.role === "user" && turn.content) {
        const content = turn.content.trim();
        return content.length > 60 ? content.substring(0, 60) + "..." : content;
      }
    }
  }
  return null;
}

export default function CommitCard({
  commit,
  isSelected = false,
  onClick,
  showProjectBadge = false,
}: CommitCardProps) {
  const hasGitHash = !!commit.gitHash;
  const borderColor = hasGitHash
    ? "border-chronicle-green"
    : "border-chronicle-amber";
  const turnCount =
    commit.turnCount ||
    commit.sessions.reduce((sum, s) => sum + s.turns.length, 0);
  const projectColor = commit.projectName
    ? getProjectColor(commit.projectName)
    : null;

  return (
    <div
      onClick={onClick}
      className={`relative rounded-lg p-3 cursor-pointer transition-all border-l-2 ${borderColor} ${
        isSelected
          ? "bg-zinc-800/80 ring-1 ring-chronicle-blue/50"
          : "bg-zinc-900/50 hover:bg-zinc-800/50"
      }`}
    >
      <div className="flex-1 min-w-0">
        {/* Project badge (when showing all projects) */}
        {showProjectBadge && commit.projectName && projectColor && (
          <div className="mb-1">
            <span
              className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${projectColor.bg} ${projectColor.text}`}
              title={`Project: ${commit.projectName}`}
            >
              {commit.projectName}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Git hash or status */}
          {commit.gitHash ? (
            <span className="font-mono text-sm text-chronicle-green">
              [{commit.gitHash.substring(0, 7)}]
            </span>
          ) : (
            <span className="font-mono text-sm text-chronicle-amber">
              [uncommitted]
            </span>
          )}

          {/* Parallel indicator */}
          {commit.parallel && (
            <span
              className="text-chronicle-purple text-xs"
              title="Parallel sessions"
            >
              ||
            </span>
          )}
        </div>

        {/* Title or first user message */}
        <div className="text-sm text-zinc-300 mt-1 truncate">
          {commit.title || getFirstUserMessage(commit) || "No content"}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
          <span>{turnCount} turns</span>
          <span>
            {commit.sessions.length} session
            {commit.sessions.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Time */}
        <div className="text-xs text-zinc-600 mt-1">
          {formatTime(commit.closedAt)}
        </div>
      </div>
    </div>
  );
}
