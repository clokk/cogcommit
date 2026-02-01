/**
 * Shared formatting utilities for CogCommit
 */

/**
 * Format model name to short display form
 */
export function formatModelName(model?: string): string {
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

/**
 * Format relative time from ISO string
 */
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format absolute time for tooltip
 */
export function formatAbsoluteTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/**
 * Format time for commit cards
 */
export function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Calculate gap in minutes between two timestamps
 */
export function getGapMinutes(timestamp1: string, timestamp2: string): number {
  const t1 = new Date(timestamp1).getTime();
  const t2 = new Date(timestamp2).getTime();
  return Math.abs(t2 - t1) / 60000;
}

/**
 * Format gap duration for display
 */
export function formatGap(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

/**
 * Escape regex special characters
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Generate a consistent color for a project name
 */
export function getProjectColor(name: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    { bg: "bg-chronicle-purple/20", text: "text-chronicle-purple" },
    { bg: "bg-blue-500/20", text: "text-blue-400" },
    { bg: "bg-emerald-500/20", text: "text-emerald-400" },
    { bg: "bg-orange-500/20", text: "text-orange-400" },
    { bg: "bg-pink-500/20", text: "text-pink-400" },
    { bg: "bg-cyan-500/20", text: "text-cyan-400" },
    { bg: "bg-yellow-500/20", text: "text-yellow-400" },
    { bg: "bg-indigo-500/20", text: "text-indigo-400" },
  ];

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Get styling for conversation source badge
 */
export function getSourceStyle(source?: string): {
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
      return { bg: "bg-cyan-500/20", text: "text-cyan-400", label: "Antigravity" };
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

/**
 * Format tool input for display
 */
export function formatToolInput(input: Record<string, unknown>): string {
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
