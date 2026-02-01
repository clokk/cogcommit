/**
 * Title generation utilities for cognitive commits
 */

import type { CognitiveCommit } from "../models/types";

/**
 * Extract first user message from a commit's sessions/turns
 */
export function extractFirstUserMessage(commit: CognitiveCommit): string | null {
  if (!commit.sessions || commit.sessions.length === 0) return null;

  for (const session of commit.sessions) {
    for (const turn of session.turns) {
      if (turn.role === "user" && turn.content?.trim()) {
        return turn.content.trim();
      }
    }
  }
  return null;
}

/**
 * Generate a title from the first user message, truncated to max length
 */
export function generateCommitTitle(
  commit: CognitiveCommit,
  maxLength: number = 100
): string | undefined {
  // Don't overwrite existing titles
  if (commit.title) return commit.title;

  const firstMessage = extractFirstUserMessage(commit);
  if (!firstMessage) return undefined;

  // Truncate at word boundary
  if (firstMessage.length <= maxLength) return firstMessage;
  return firstMessage.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}
