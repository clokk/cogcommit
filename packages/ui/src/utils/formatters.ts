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

  // Muted dusty color palette for project badges
  const colors = [
    { bg: "bg-[#8a7aab]/20", text: "text-[#a090c0]" },  // muted purple
    { bg: "bg-[#5a8a9a]/20", text: "text-[#6a9aaa]" },  // muted blue
    { bg: "bg-[#5a9a7a]/20", text: "text-[#6aaa8a]" },  // muted green
    { bg: "bg-[#b8923a]/20", text: "text-[#c8a24a]" },  // muted amber
    { bg: "bg-[#a07080]/20", text: "text-[#b08090]" },  // muted pink
    { bg: "bg-[#5a8a8a]/20", text: "text-[#6a9a9a]" },  // muted cyan
    { bg: "bg-[#a09050]/20", text: "text-[#b0a060]" },  // muted yellow
    { bg: "bg-[#6a7a9a]/20", text: "text-[#7a8aaa]" },  // muted indigo
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
  // Muted dusty colors for source badges
  switch (source) {
    case "claude_code":
      return { bg: "bg-[#5a8a9a]/20", text: "text-[#6a9aaa]", label: "Claude" };
    case "cursor":
      return {
        bg: "bg-[#8a7aab]/20",
        text: "text-[#a090c0]",
        label: "Cursor",
      };
    case "antigravity":
      return { bg: "bg-[#5a8a8a]/20", text: "text-[#6a9a9a]", label: "Antigravity" };
    case "codex":
      return {
        bg: "bg-[#5a9a7a]/20",
        text: "text-[#6aaa8a]",
        label: "Codex",
      };
    case "opencode":
      return {
        bg: "bg-[#b8923a]/20",
        text: "text-[#c8a24a]",
        label: "OpenCode",
      };
    default:
      return { bg: "bg-text-subtle/20", text: "text-muted", label: "Unknown" };
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

/**
 * Format a time range for display
 * Shows: "Jan 15, 2025 2:30 PM – 4:45 PM (2h 15m)"
 * Or if spanning multiple days: "Jan 15, 2:30 PM – Jan 16, 10:00 AM (19h 30m)"
 */
export function formatTimeRange(startedAt: string, closedAt: string): string {
  // Ensure chronological order (start should be before end)
  const t1 = new Date(startedAt);
  const t2 = new Date(closedAt);
  const start = t1 <= t2 ? t1 : t2;
  const end = t1 <= t2 ? t2 : t1;

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  const fullDateTimeOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  // Calculate duration (use Math.abs to handle swapped start/end times)
  const durationMs = Math.abs(end.getTime() - start.getTime());
  const durationMins = Math.floor(durationMs / 60000);
  const durationStr = formatGap(durationMins);

  if (sameDay) {
    // Same day: "Jan 15, 2025 2:30 PM – 4:45 PM (2h 15m)"
    const startStr = start.toLocaleString("en-US", fullDateTimeOptions);
    const endStr = end.toLocaleString("en-US", timeOptions);
    return `${startStr} – ${endStr} (${durationStr})`;
  } else {
    // Different days: "Jan 15, 2:30 PM – Jan 16, 10:00 AM (19h 30m)"
    const startStr = start.toLocaleString("en-US", dateTimeOptions);
    const endStr = end.toLocaleString("en-US", dateTimeOptions);
    return `${startStr} – ${endStr} (${durationStr})`;
  }
}

/**
 * Generate a preview title from the first user message
 */
export function generateTitlePreview(firstUserContent: string | undefined): string {
  if (!firstUserContent) return "Empty conversation";

  // Truncate to ~50 chars, break at word boundary
  const content = firstUserContent.trim();
  if (content.length <= 50) return content;
  return content.slice(0, 50).replace(/\s+\S*$/, "") + "…";
}

/**
 * Get styling for closure type badge
 */
export function getClosureStyle(closedBy: "git_commit" | "session_end" | "explicit"): {
  bg: string;
  text: string;
  label: string;
} {
  switch (closedBy) {
    case "git_commit":
      return { bg: "bg-chronicle-green/20", text: "text-chronicle-green", label: "committed" };
    case "session_end":
      return { bg: "bg-chronicle-amber/20", text: "text-chronicle-amber", label: "session ended" };
    case "explicit":
      return { bg: "bg-chronicle-purple/20", text: "text-chronicle-purple", label: "closed" };
  }
}
