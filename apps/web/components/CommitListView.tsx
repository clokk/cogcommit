"use client";

import React from "react";
import Link from "next/link";
import { CommitCard } from "@cogcommit/ui";
import type { CognitiveCommit } from "@cogcommit/types";

interface CommitListViewProps {
  commits: CognitiveCommit[];
}

export default function CommitListView({ commits }: CommitListViewProps) {
  if (commits.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-zinc-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h2 className="text-lg font-medium text-white mb-2">No commits yet</h2>
        <p className="text-zinc-400 max-w-md mx-auto mb-6">
          Install the Agentlogs CLI and sync your Claude Code conversations to
          see them here.
        </p>
        <a
          href="/docs"
          className="inline-flex px-4 py-2 bg-chronicle-blue text-black rounded-lg font-medium hover:bg-chronicle-blue/90 transition-colors"
        >
          Get Started
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {commits.map((commit) => (
        <Link
          key={commit.id}
          href={`/dashboard/commits/${commit.id}`}
          className="block"
        >
          <CommitCard commit={commit} showProjectBadge={!!commit.projectName} />
        </Link>
      ))}
    </div>
  );
}
