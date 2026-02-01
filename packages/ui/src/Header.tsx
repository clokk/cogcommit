"use client";

import React from "react";

interface ProjectListItem {
  name: string;
  count: number;
}

interface HeaderProps {
  projectName: string;
  isGlobal?: boolean;
  stats?: {
    commitCount: number;
    totalTurns: number;
  };
  // Global mode props
  projects?: ProjectListItem[];
  totalCount?: number;
  selectedProject?: string | null;
  onSelectProject?: (project: string | null) => void;
}

export default function Header({
  projectName,
  isGlobal,
  stats,
  projects,
  totalCount,
  selectedProject,
  onSelectProject,
}: HeaderProps) {
  return (
    <header className="bg-bg border-b border-zinc-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-chronicle-blue">
            Studio: {projectName}
          </h1>

          {/* Project filter dropdown (global mode only) */}
          {isGlobal && projects && projects.length > 0 && onSelectProject && (
            <div className="relative">
              <select
                value={selectedProject || ""}
                onChange={(e) => onSelectProject(e.target.value || null)}
                className="appearance-none bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 pr-8 text-sm text-white focus:border-chronicle-blue focus:outline-none cursor-pointer"
              >
                <option value="">All Projects ({totalCount})</option>
                {projects.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} ({p.count})
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          )}

          {stats && (
            <div className="flex items-center gap-4 text-sm text-zinc-400">
              <span>{stats.commitCount} commits</span>
              <span>{stats.totalTurns} turns</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
