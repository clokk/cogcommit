import type { CognitiveCommit, Turn } from "../api";

/**
 * Format a single turn as markdown
 */
export function formatTurnAsMarkdown(turn: Turn): string {
  const role = turn.role === "user" ? "**You**" : "**Agent**";
  const timestamp = new Date(turn.timestamp).toLocaleString();

  let content = `### ${role} — ${timestamp}\n\n${turn.content || ""}`;

  if (turn.toolCalls?.length) {
    content += "\n\n**Tool calls:**\n";
    for (const tc of turn.toolCalls) {
      content += `- \`${tc.name}\``;
      // Add brief summary if available
      if ("file_path" in tc.input) {
        content += ` (${tc.input.file_path})`;
      } else if ("command" in tc.input) {
        const cmd = String(tc.input.command);
        content += ` (${cmd.length > 50 ? cmd.substring(0, 50) + "..." : cmd})`;
      }
      content += "\n";
    }
  }

  return content;
}

/**
 * Format a single turn as plain text
 */
export function formatTurnAsPlainText(turn: Turn): string {
  const role = turn.role === "user" ? "You" : "Agent";
  const timestamp = new Date(turn.timestamp).toLocaleString();

  let content = `${role} — ${timestamp}\n\n${turn.content || ""}`;

  if (turn.toolCalls?.length) {
    content += "\n\nTool calls:\n";
    for (const tc of turn.toolCalls) {
      content += `  - ${tc.name}`;
      if ("file_path" in tc.input) {
        content += ` (${tc.input.file_path})`;
      } else if ("command" in tc.input) {
        const cmd = String(tc.input.command);
        content += ` (${cmd.length > 50 ? cmd.substring(0, 50) + "..." : cmd})`;
      }
      content += "\n";
    }
  }

  return content;
}

/**
 * Format an entire cognitive commit as markdown
 */
export function formatCommitAsMarkdown(commit: CognitiveCommit): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${commit.title || "Conversation"}`);
  lines.push("");
  if (commit.gitHash) lines.push(`**Git:** \`${commit.gitHash}\``);
  lines.push(`**Date:** ${new Date(commit.closedAt).toLocaleString()}`);
  if (commit.projectName) lines.push(`**Project:** ${commit.projectName}`);
  lines.push("");

  // Files changed
  if (commit.filesChanged.length > 0) {
    lines.push("**Files changed:**");
    for (const file of commit.filesChanged) {
      lines.push(`- \`${file}\``);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("");

  // Turns
  for (const session of commit.sessions) {
    for (const turn of session.turns) {
      lines.push(formatTurnAsMarkdown(turn));
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Format an entire cognitive commit as plain text
 */
export function formatCommitAsPlainText(commit: CognitiveCommit): string {
  const lines: string[] = [];

  // Header
  lines.push(commit.title || "Conversation");
  lines.push("=".repeat((commit.title || "Conversation").length));
  lines.push("");
  if (commit.gitHash) lines.push(`Git: ${commit.gitHash}`);
  lines.push(`Date: ${new Date(commit.closedAt).toLocaleString()}`);
  if (commit.projectName) lines.push(`Project: ${commit.projectName}`);
  lines.push("");

  // Files changed
  if (commit.filesChanged.length > 0) {
    lines.push("Files changed:");
    for (const file of commit.filesChanged) {
      lines.push(`  - ${file}`);
    }
    lines.push("");
  }

  lines.push("-".repeat(40));
  lines.push("");

  // Turns
  for (const session of commit.sessions) {
    for (const turn of session.turns) {
      lines.push(formatTurnAsPlainText(turn));
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Trigger a file download in the browser
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
