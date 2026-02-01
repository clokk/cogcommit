import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  fetchCommit,
  updateCommit,
  deleteCommit as apiDeleteCommit,
  type CognitiveCommit,
  type Turn,
} from "../api";
import TurnView from "./TurnView";
import ToolOnlyGroup from "./ToolOnlyGroup";
import {
  formatCommitAsMarkdown,
  formatCommitAsPlainText,
  downloadFile,
  copyToClipboard,
} from "../utils/export";

interface CommitDetailProps {
  commitId: string;
  onUpdate: (commit: CognitiveCommit) => void;
  onDelete: (id: string) => void;
}

// Font size settings
const FONT_SIZE_KEY = "cogcommit-font-size";
const FONT_SIZES = [12, 14, 16, 18, 20] as const;
type FontSize = (typeof FONT_SIZES)[number];
const DEFAULT_FONT_SIZE: FontSize = 16;

/**
 * Get styling for conversation source badge
 */
function getSourceStyle(source?: string): { bg: string; text: string; label: string } {
  switch (source) {
    case "claude_code":
      return { bg: "bg-blue-500/20", text: "text-blue-400", label: "Claude" };
    case "cursor":
      return { bg: "bg-purple-500/20", text: "text-purple-400", label: "Cursor" };
    case "antigravity":
      return { bg: "bg-cyan-500/20", text: "text-cyan-400", label: "Antigravity" };
    case "codex":
      return { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Codex" };
    case "opencode":
      return { bg: "bg-orange-500/20", text: "text-orange-400", label: "OpenCode" };
    default:
      return { bg: "bg-zinc-500/20", text: "text-zinc-400", label: "Unknown" };
  }
}

/**
 * Generate a consistent color for a project name
 */
function getProjectColor(name: string): { bg: string; text: string } {
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
 * Calculate gap in minutes between two timestamps
 */
function getGapMinutes(timestamp1: string, timestamp2: string): number {
  const t1 = new Date(timestamp1).getTime();
  const t2 = new Date(timestamp2).getTime();
  return Math.abs(t2 - t1) / 60000;
}

/**
 * Format gap duration for display
 */
function formatGap(minutes: number): string {
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
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Check if a turn is tool-only (no text content, only tool calls)
 */
function isToolOnlyTurn(turn: Turn): boolean {
  return (
    turn.role === "assistant" &&
    (!turn.content || turn.content.trim() === "") &&
    turn.toolCalls &&
    turn.toolCalls.length > 0
  );
}

export default function CommitDetail({
  commitId,
  onUpdate,
  onDelete,
}: CommitDetailProps) {
  const [commit, setCommit] = useState<CognitiveCommit | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Item navigation state (navigates by visual items, not raw turns)
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMatchIndices, setSearchMatchIndices] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Font size state
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const stored = localStorage.getItem(FONT_SIZE_KEY);
    if (stored && FONT_SIZES.includes(parseInt(stored, 10) as FontSize)) {
      return parseInt(stored, 10) as FontSize;
    }
    return DEFAULT_FONT_SIZE;
  });

  const increaseFontSize = useCallback(() => {
    setFontSize((current) => {
      const idx = FONT_SIZES.indexOf(current);
      const next = FONT_SIZES[Math.min(idx + 1, FONT_SIZES.length - 1)];
      localStorage.setItem(FONT_SIZE_KEY, next.toString());
      return next;
    });
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize((current) => {
      const idx = FONT_SIZES.indexOf(current);
      const next = FONT_SIZES[Math.max(idx - 1, 0)];
      localStorage.setItem(FONT_SIZE_KEY, next.toString());
      return next;
    });
  }, []);

  // Export handlers
  const handleExportMarkdown = useCallback(() => {
    if (!commit) return;
    const content = formatCommitAsMarkdown(commit);
    const filename = `${commit.title || "conversation"}-${commit.id.slice(0, 8)}.md`;
    downloadFile(content, filename, "text/markdown");
    setShowExportMenu(false);
  }, [commit]);

  const handleExportPlainText = useCallback(() => {
    if (!commit) return;
    const content = formatCommitAsPlainText(commit);
    const filename = `${commit.title || "conversation"}-${commit.id.slice(0, 8)}.txt`;
    downloadFile(content, filename, "text/plain");
    setShowExportMenu(false);
  }, [commit]);

  const handleCopyConversation = useCallback(async () => {
    if (!commit) return;
    const content = formatCommitAsMarkdown(commit);
    const success = await copyToClipboard(content);
    if (success) {
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 1500);
    }
    setShowExportMenu(false);
  }, [commit]);

  // Close export menu when clicking outside
  useEffect(() => {
    if (!showExportMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showExportMenu]);

  const conversationRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const isScrollingProgrammatically = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flatten all turns for stats
  const allTurns = useMemo(() => {
    if (!commit) return [];
    return commit.sessions.flatMap((s) => s.turns);
  }, [commit]);

  // Build render items (groups consecutive tool-only turns)
  type RenderItem =
    | { type: "turn"; turn: Turn; gapMinutes: number | null; isMatch: boolean }
    | { type: "tool-group"; turns: Turn[]; gapMinutes: number | null };

  const renderItems = useMemo((): RenderItem[] => {
    if (!commit) return [];

    const items: RenderItem[] = [];
    let prevTimestamp: string | null = null;
    let currentToolGroup: Turn[] = [];
    let toolGroupGap: number | null = null;

    const flushToolGroup = () => {
      if (currentToolGroup.length > 0) {
        items.push({
          type: "tool-group",
          turns: currentToolGroup,
          gapMinutes: toolGroupGap,
        });
        currentToolGroup = [];
        toolGroupGap = null;
      }
    };

    for (const session of commit.sessions) {
      for (const turn of session.turns) {
        const gapMinutes = prevTimestamp ? getGapMinutes(prevTimestamp, turn.timestamp) : null;
        const isMatch = searchTerm
          ? new RegExp(escapeRegex(searchTerm), "i").test(turn.content)
          : false;

        if (isToolOnlyTurn(turn)) {
          if (currentToolGroup.length === 0) {
            toolGroupGap = gapMinutes;
          }
          currentToolGroup.push(turn);
        } else {
          flushToolGroup();
          items.push({ type: "turn", turn, gapMinutes, isMatch });
        }

        prevTimestamp = turn.timestamp;
      }
    }

    flushToolGroup();
    return items;
  }, [commit, searchTerm]);

  // Find search matches (by item index)
  useEffect(() => {
    if (!searchTerm || !renderItems.length) {
      setSearchMatchIndices([]);
      setCurrentMatchIndex(0);
      return;
    }

    const matches: number[] = [];
    renderItems.forEach((item, idx) => {
      if (item.type === "turn" && item.isMatch) {
        matches.push(idx);
      }
    });
    setSearchMatchIndices(matches);
    setCurrentMatchIndex(0);

    // Scroll to first match
    if (matches.length > 0) {
      scrollToItem(matches[0]);
    }
  }, [searchTerm, renderItems]);

  // Scroll to a specific item
  const scrollToItem = useCallback((index: number) => {
    const ref = itemRefs.current.get(index);
    if (ref) {
      // Clear any pending timeout from previous scroll
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      // Block scroll listener from overriding during animation
      isScrollingProgrammatically.current = true;
      ref.scrollIntoView({ behavior: "smooth", block: "center" });
      // Re-enable after animation completes (smooth scroll ~300-500ms)
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingProgrammatically.current = false;
        scrollTimeoutRef.current = null;
      }, 500);
    }
    setCurrentItemIndex(index);
  }, []);

  // Navigate to next/prev item
  const goToNextItem = useCallback(() => {
    if (currentItemIndex < renderItems.length - 1) {
      scrollToItem(currentItemIndex + 1);
    }
  }, [currentItemIndex, renderItems.length, scrollToItem]);

  const goToPrevItem = useCallback(() => {
    if (currentItemIndex > 0) {
      scrollToItem(currentItemIndex - 1);
    }
  }, [currentItemIndex, scrollToItem]);

  // Navigate to next/prev user message
  const goToNextUserItem = useCallback(() => {
    for (let i = currentItemIndex + 1; i < renderItems.length; i++) {
      const item = renderItems[i];
      if (item.type === "turn" && item.turn.role === "user") {
        scrollToItem(i);
        return;
      }
    }
  }, [currentItemIndex, renderItems, scrollToItem]);

  const goToPrevUserItem = useCallback(() => {
    for (let i = currentItemIndex - 1; i >= 0; i--) {
      const item = renderItems[i];
      if (item.type === "turn" && item.turn.role === "user") {
        scrollToItem(i);
        return;
      }
    }
  }, [currentItemIndex, renderItems, scrollToItem]);

  // Update current item based on scroll position
  useEffect(() => {
    const container = conversationRef.current;
    if (!container || renderItems.length === 0) return;

    const handleScroll = () => {
      // Skip if we're doing programmatic scrolling (from arrow clicks)
      if (isScrollingProgrammatically.current) return;

      const containerRect = container.getBoundingClientRect();
      const containerTop = containerRect.top;

      // Find the item closest to the top of the visible area
      let closestIdx = 0;
      let closestDistance = Infinity;

      itemRefs.current.forEach((el, idx) => {
        const rect = el.getBoundingClientRect();
        // Distance from item top to container top (positive = below, negative = above)
        const distance = rect.top - containerTop;

        // We want the item that's closest to or just past the top
        // Prefer items that are visible (distance >= -rect.height)
        if (distance >= -rect.height && distance < closestDistance) {
          closestDistance = distance;
          closestIdx = idx;
        }
      });

      setCurrentItemIndex(closestIdx);
    };

    // Debounce scroll handler for performance
    let ticking = false;
    const scrollListener = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener("scroll", scrollListener);
    return () => container.removeEventListener("scroll", scrollListener);
  }, [renderItems.length]);

  // Navigate search matches
  const goToNextMatch = useCallback(() => {
    if (searchMatchIndices.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchMatchIndices.length;
    setCurrentMatchIndex(nextIdx);
    scrollToItem(searchMatchIndices[nextIdx]);
  }, [currentMatchIndex, searchMatchIndices, scrollToItem]);

  const goToPrevMatch = useCallback(() => {
    if (searchMatchIndices.length === 0) return;
    const prevIdx = currentMatchIndex === 0
      ? searchMatchIndices.length - 1
      : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIdx);
    scrollToItem(searchMatchIndices[prevIdx]);
  }, [currentMatchIndex, searchMatchIndices, scrollToItem]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "j") {
        e.preventDefault();
        goToNextItem();
      } else if (e.key === "k") {
        e.preventDefault();
        goToPrevItem();
      } else if (e.key === "J") {
        e.preventDefault();
        goToNextUserItem();
      } else if (e.key === "K") {
        e.preventDefault();
        goToPrevUserItem();
      } else if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
        searchInput?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextItem, goToPrevItem, goToNextUserItem, goToPrevUserItem]);

  useEffect(() => {
    setLoading(true);
    setSearchTerm("");
    setCurrentItemIndex(0);
    fetchCommit(commitId)
      .then(({ commit }) => {
        setCommit(commit);
        setTitleValue(commit.title || "");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [commitId]);

  // Scroll to top when commit data changes
  useEffect(() => {
    if (commit && conversationRef.current) {
      conversationRef.current.scrollTop = 0;
    }
  }, [commit]);

  if (loading || !commit) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">
        Loading...
      </div>
    );
  }

  const handleSaveTitle = async () => {
    try {
      const { commit: updated } = await updateCommit(commitId, {
        title: titleValue || undefined,
      });
      setCommit({ ...commit, ...updated });
      onUpdate({ ...commit, ...updated });
      setEditingTitle(false);
    } catch (err) {
      console.error("Failed to update title:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await apiDeleteCommit(commitId);
      onDelete(commitId);
    } catch (err) {
      console.error("Failed to delete commit:", err);
    }
  };

  const turnCount = commit.sessions.reduce((sum, s) => sum + s.turns.length, 0);
  const projectColor = commit.projectName ? getProjectColor(commit.projectName) : null;
  const sourceStyle = getSourceStyle(commit.source);
  const currentItem = renderItems[currentItemIndex];

  return (
    <div className="h-full flex flex-col animate-slide-in" style={{ minHeight: 0 }}>
      {/* Compact Header Section */}
      <div className="flex-shrink-0 p-4 border-b border-zinc-800 bg-panel-alt">
        {/* Row 1: Metadata + Stats + Search + Actions */}
        <div className="flex items-center gap-3 text-sm">
          {/* Source badge */}
          <span className={`px-2 py-0.5 text-xs font-medium rounded ${sourceStyle.bg} ${sourceStyle.text}`}>
            {sourceStyle.label}
          </span>

          {/* Project badge */}
          {commit.projectName && projectColor && (
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded ${projectColor.bg} ${projectColor.text}`}
            >
              {commit.projectName}
            </span>
          )}

          {/* Git hash */}
          {commit.gitHash ? (
            <span className="font-mono text-chronicle-green text-xs">
              [{commit.gitHash}]
            </span>
          ) : (
            <span className="font-mono text-chronicle-amber text-xs">
              [uncommitted]
            </span>
          )}

          {/* Stats - compact with separators */}
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-500">{turnCount} turns</span>
          <span className="text-zinc-600">·</span>
          {commit.filesChanged.length > 0 ? (
            <button
              onClick={() => setShowFilesModal(true)}
              className="text-chronicle-amber hover:text-chronicle-amber/80 transition-colors"
            >
              {commit.filesChanged.length} files
            </button>
          ) : (
            <span className="text-zinc-500">0 files</span>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              data-search-input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="/ search"
              className="w-36 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white placeholder-zinc-500 focus:border-chronicle-blue focus:outline-none focus:w-48 transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (e.shiftKey) goToPrevMatch();
                  else goToNextMatch();
                }
                if (e.key === "Escape") {
                  setSearchTerm("");
                  e.currentTarget.blur();
                }
              }}
            />
            {searchTerm && searchMatchIndices.length > 0 && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="text-xs text-zinc-400">
                  {currentMatchIndex + 1}/{searchMatchIndices.length}
                </span>
                <button
                  onClick={goToPrevMatch}
                  className="text-zinc-400 hover:text-white p-0.5"
                  title="Previous match (Shift+Enter)"
                >
                  ▲
                </button>
                <button
                  onClick={goToNextMatch}
                  className="text-zinc-400 hover:text-white p-0.5"
                  title="Next match (Enter)"
                >
                  ▼
                </button>
              </div>
            )}
            {searchTerm && searchMatchIndices.length === 0 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                0
              </span>
            )}
          </div>

          {/* Export dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors flex items-center gap-1"
            >
              {exportCopied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-chronicle-green">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              )}
              Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded shadow-lg z-10 py-1 min-w-[160px]">
                <button
                  onClick={handleExportMarkdown}
                  className="block w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  Download as Markdown
                </button>
                <button
                  onClick={handleExportPlainText}
                  className="block w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  Download as Plain Text
                </button>
                <button
                  onClick={handleCopyConversation}
                  className="block w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  Copy to Clipboard
                </button>
              </div>
            )}
          </div>

          {/* Delete button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
          >
            Delete
          </button>
        </div>

        {/* Row 2: Editable title */}
        <div className="mt-2">
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                placeholder="Enter a title..."
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-white text-sm focus:border-chronicle-blue focus:outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") setEditingTitle(false);
                }}
              />
              <button
                onClick={handleSaveTitle}
                className="px-2 py-1.5 bg-chronicle-blue text-black rounded font-medium text-xs hover:bg-chronicle-blue/90"
              >
                Save
              </button>
              <button
                onClick={() => setEditingTitle(false)}
                className="px-2 py-1.5 bg-zinc-700 text-white rounded font-medium text-xs hover:bg-zinc-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <h2
              onClick={() => setEditingTitle(true)}
              className="text-base font-medium text-white cursor-pointer hover:text-chronicle-blue transition-colors"
            >
              {commit.title || (
                <span className="text-zinc-500 italic text-sm">Click to add title...</span>
              )}
            </h2>
          )}
        </div>
      </div>

      {/* Conversation Section - independent scroll */}
      <div
        ref={conversationRef}
        className="p-6 pt-4"
        style={{ flex: '1 1 0%', minHeight: 0, overflowY: 'auto' }}
      >
        <div className="space-y-4">
          {renderItems.map((item, idx) => {
            if (item.type === "tool-group") {
              const groupKey = item.turns.map((t) => t.id).join("-");
              return (
                <React.Fragment key={groupKey}>
                  {/* Time gap divider */}
                  {item.gapMinutes !== null && item.gapMinutes > 60 && (
                    <div className="flex items-center gap-4 py-2 text-zinc-600 text-xs">
                      <div className="flex-1 h-px bg-zinc-800" />
                      <span>{formatGap(item.gapMinutes)} later</span>
                      <div className="flex-1 h-px bg-zinc-800" />
                    </div>
                  )}
                  <ToolOnlyGroup
                    ref={(el) => {
                      if (el) itemRefs.current.set(idx, el);
                    }}
                    turns={item.turns}
                    searchTerm={searchTerm}
                  />
                </React.Fragment>
              );
            }

            const { turn, gapMinutes, isMatch } = item;
            return (
              <React.Fragment key={turn.id}>
                {/* Time gap divider */}
                {gapMinutes !== null && gapMinutes > 60 && (
                  <div className="flex items-center gap-4 py-2 text-zinc-600 text-xs">
                    <div className="flex-1 h-px bg-zinc-800" />
                    <span>{formatGap(gapMinutes)} later</span>
                    <div className="flex-1 h-px bg-zinc-800" />
                  </div>
                )}
                <TurnView
                  ref={(el) => {
                    if (el) itemRefs.current.set(idx, el);
                  }}
                  turn={turn}
                  searchTerm={searchTerm}
                  isMatch={isMatch}
                  fontSize={fontSize}
                />
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Item navigation bar */}
      <div className="flex-shrink-0 px-6 py-3 border-t border-zinc-800 bg-panel-alt flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevItem}
            disabled={currentItemIndex === 0}
            className="text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous item (k)"
          >
            ◀
          </button>
          <span className="text-sm text-zinc-400 font-mono w-32 text-center">
            {currentItemIndex + 1} / {renderItems.length}
          </span>
          <button
            onClick={goToNextItem}
            disabled={currentItemIndex >= renderItems.length - 1}
            className="text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next item (j)"
          >
            ▶
          </button>
        </div>
        {currentItem && (
          <span className="text-xs text-zinc-500">
            {currentItem.type === "tool-group"
              ? `${currentItem.turns.length} tools`
              : currentItem.turn.role === "user"
              ? "User"
              : "Agent"}
          </span>
        )}

        <div className="flex-1" />

        {/* Font size controls */}
        <div className="flex items-center gap-1 border border-zinc-700 rounded">
          <button
            onClick={decreaseFontSize}
            disabled={fontSize === FONT_SIZES[0]}
            className="px-2 py-1 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-l"
            title="Decrease font size"
          >
            <span className="text-xs font-bold">A</span>
          </button>
          <span className="px-2 text-xs text-zinc-500 font-mono">{fontSize}</span>
          <button
            onClick={increaseFontSize}
            disabled={fontSize === FONT_SIZES[FONT_SIZES.length - 1]}
            className="px-2 py-1 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-r"
            title="Increase font size"
          >
            <span className="text-sm font-bold">A</span>
          </button>
        </div>

        <span className="text-xs text-zinc-600">
          j/k: turns · J/K: user only · /: search
        </span>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-panel rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-medium text-white mb-2">Delete Commit?</h3>
            <p className="text-zinc-400 mb-4">
              This will permanently delete this cognitive commit and all associated
              data. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-zinc-700 text-white rounded font-medium hover:bg-zinc-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Files changed modal */}
      {showFilesModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setShowFilesModal(false)}
        >
          <div
            className="bg-panel rounded-lg p-6 w-full mx-8 max-w-[90vw] max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">
                Files Changed ({commit.filesChanged.length})
              </h3>
              <button
                onClick={() => setShowFilesModal(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1 bg-zinc-900 rounded-lg p-4">
              <ul className="space-y-1">
                {commit.filesChanged.map((file, i) => (
                  <li key={i} className="font-mono text-sm text-chronicle-amber">
                    {file}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
