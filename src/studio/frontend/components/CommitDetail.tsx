import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  fetchCommit,
  updateCommit,
  deleteCommit as apiDeleteCommit,
  type CognitiveCommit,
  type Turn,
} from "../api";
import TurnView from "./TurnView";

interface CommitDetailProps {
  commitId: string;
  onUpdate: (commit: CognitiveCommit) => void;
  onDelete: (id: string) => void;
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

  // Turn navigation state
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMatchIndices, setSearchMatchIndices] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const conversationRef = useRef<HTMLDivElement>(null);
  const turnRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Flatten all turns for navigation
  const allTurns = useMemo(() => {
    if (!commit) return [];
    return commit.sessions.flatMap((s) => s.turns);
  }, [commit]);

  // Find search matches
  useEffect(() => {
    if (!searchTerm || !allTurns.length) {
      setSearchMatchIndices([]);
      setCurrentMatchIndex(0);
      return;
    }

    const regex = new RegExp(escapeRegex(searchTerm), "i");
    const matches: number[] = [];
    allTurns.forEach((turn, idx) => {
      if (regex.test(turn.content)) {
        matches.push(idx);
      }
    });
    setSearchMatchIndices(matches);
    setCurrentMatchIndex(0);

    // Scroll to first match
    if (matches.length > 0) {
      scrollToTurn(matches[0]);
    }
  }, [searchTerm, allTurns]);

  // Scroll to a specific turn
  const scrollToTurn = useCallback((index: number) => {
    const turn = allTurns[index];
    if (!turn) return;
    const ref = turnRefs.current.get(turn.id);
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setCurrentTurnIndex(index);
  }, [allTurns]);

  // Navigate to next/prev turn
  const goToNextTurn = useCallback(() => {
    if (currentTurnIndex < allTurns.length - 1) {
      scrollToTurn(currentTurnIndex + 1);
    }
  }, [currentTurnIndex, allTurns.length, scrollToTurn]);

  const goToPrevTurn = useCallback(() => {
    if (currentTurnIndex > 0) {
      scrollToTurn(currentTurnIndex - 1);
    }
  }, [currentTurnIndex, scrollToTurn]);

  // Navigate to next/prev user message
  const goToNextUserTurn = useCallback(() => {
    for (let i = currentTurnIndex + 1; i < allTurns.length; i++) {
      if (allTurns[i].role === "user") {
        scrollToTurn(i);
        return;
      }
    }
  }, [currentTurnIndex, allTurns, scrollToTurn]);

  const goToPrevUserTurn = useCallback(() => {
    for (let i = currentTurnIndex - 1; i >= 0; i--) {
      if (allTurns[i].role === "user") {
        scrollToTurn(i);
        return;
      }
    }
  }, [currentTurnIndex, allTurns, scrollToTurn]);

  // Navigate search matches
  const goToNextMatch = useCallback(() => {
    if (searchMatchIndices.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchMatchIndices.length;
    setCurrentMatchIndex(nextIdx);
    scrollToTurn(searchMatchIndices[nextIdx]);
  }, [currentMatchIndex, searchMatchIndices, scrollToTurn]);

  const goToPrevMatch = useCallback(() => {
    if (searchMatchIndices.length === 0) return;
    const prevIdx = currentMatchIndex === 0
      ? searchMatchIndices.length - 1
      : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIdx);
    scrollToTurn(searchMatchIndices[prevIdx]);
  }, [currentMatchIndex, searchMatchIndices, scrollToTurn]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "j") {
        e.preventDefault();
        goToNextTurn();
      } else if (e.key === "k") {
        e.preventDefault();
        goToPrevTurn();
      } else if (e.key === "J") {
        e.preventDefault();
        goToNextUserTurn();
      } else if (e.key === "K") {
        e.preventDefault();
        goToPrevUserTurn();
      } else if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
        searchInput?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextTurn, goToPrevTurn, goToNextUserTurn, goToPrevUserTurn]);

  useEffect(() => {
    setLoading(true);
    setSearchTerm("");
    setCurrentTurnIndex(0);
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
  const currentTurn = allTurns[currentTurnIndex];

  // Build flat list of turns with gap info
  interface TurnWithMeta {
    turn: Turn;
    gapMinutes: number | null;
    isMatch: boolean;
  }

  const turnsWithMeta: TurnWithMeta[] = [];
  let prevTimestamp: string | null = null;

  for (const session of commit.sessions) {
    for (const turn of session.turns) {
      const gapMinutes = prevTimestamp ? getGapMinutes(prevTimestamp, turn.timestamp) : null;
      const isMatch = searchTerm
        ? new RegExp(escapeRegex(searchTerm), "i").test(turn.content)
        : false;
      turnsWithMeta.push({ turn, gapMinutes, isMatch });
      prevTimestamp = turn.timestamp;
    }
  }

  return (
    <div className="h-full flex flex-col animate-slide-in" style={{ minHeight: 0 }}>
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 p-6 pb-4 border-b border-zinc-800 bg-panel-alt">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Project badge + Git hash */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {commit.projectName && projectColor && (
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded ${projectColor.bg} ${projectColor.text}`}
                >
                  {commit.projectName}
                </span>
              )}
              {commit.gitHash ? (
                <span className="font-mono text-chronicle-green">
                  [{commit.gitHash}]
                </span>
              ) : (
                <span className="font-mono text-chronicle-amber">
                  [uncommitted]
                </span>
              )}
              <span className="text-zinc-500">
                closed by {commit.closedBy.replace("_", " ")}
              </span>
            </div>

            {/* Editable title */}
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  placeholder="Enter a title..."
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white focus:border-chronicle-blue focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") setEditingTitle(false);
                  }}
                />
                <button
                  onClick={handleSaveTitle}
                  className="px-3 py-2 bg-chronicle-blue text-black rounded font-medium text-sm hover:bg-chronicle-blue/90"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingTitle(false)}
                  className="px-3 py-2 bg-zinc-700 text-white rounded font-medium text-sm hover:bg-zinc-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <h2
                onClick={() => setEditingTitle(true)}
                className="text-xl font-medium text-white cursor-pointer hover:text-chronicle-blue transition-colors"
              >
                {commit.title || (
                  <span className="text-zinc-500 italic">Click to add title...</span>
                )}
              </h2>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Stats row with search */}
        <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
          <span>{turnCount} turns</span>
          <span>{commit.sessions.length} session{commit.sessions.length !== 1 ? "s" : ""}</span>
          {commit.filesChanged.length > 0 ? (
            <button
              onClick={() => setShowFilesModal(true)}
              className="text-chronicle-amber hover:text-chronicle-amber/80 transition-colors"
            >
              {commit.filesChanged.length} files changed
            </button>
          ) : (
            <span>0 files changed</span>
          )}

          {/* Search input */}
          <div className="flex-1" />
          <div className="relative">
            <input
              type="text"
              data-search-input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search... (press /)"
              className="w-48 bg-zinc-800 border border-zinc-700 rounded px-3 py-1 text-sm text-white placeholder-zinc-500 focus:border-chronicle-blue focus:outline-none"
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
                No matches
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Conversation Section - independent scroll */}
      <div
        ref={conversationRef}
        className="p-6 pt-4"
        style={{ flex: '1 1 0%', minHeight: 0, overflowY: 'auto' }}
      >
        <div className="space-y-4">
          {turnsWithMeta.map(({ turn, gapMinutes, isMatch }, idx) => (
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
                  if (el) turnRefs.current.set(turn.id, el);
                }}
                turn={turn}
                searchTerm={searchTerm}
                isMatch={isMatch}
              />
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Turn counter navigation bar */}
      <div className="flex-shrink-0 px-6 py-3 border-t border-zinc-800 bg-panel-alt flex items-center gap-4">
        <button
          onClick={goToPrevTurn}
          disabled={currentTurnIndex === 0}
          className="text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Previous turn (k)"
        >
          ◀
        </button>
        <span className="text-sm text-zinc-400 font-mono">
          Turn {currentTurnIndex + 1} of {allTurns.length}
          {currentTurn && (
            <span className="ml-2 text-zinc-500">
              ({currentTurn.role === "user" ? "User" : "Agent"})
            </span>
          )}
        </span>
        <button
          onClick={goToNextTurn}
          disabled={currentTurnIndex >= allTurns.length - 1}
          className="text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Next turn (j)"
        >
          ▶
        </button>

        <div className="flex-1" />

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
