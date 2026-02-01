import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { transformCommitWithRelations, type DbCommitWithRelations } from "@cogcommit/supabase";
import type { CognitiveCommit } from "@cogcommit/types";

interface ProjectListItem {
  name: string;
  count: number;
}

interface CachedCommitsResult {
  commits: CognitiveCommit[];
  projects: ProjectListItem[];
  totalCount: number;
}

/**
 * Fetch commits with request-level memoization.
 * Uses React's cache() to deduplicate requests within a single render.
 * Client-side caching is handled by React Query (5min staleTime).
 */
export const getCachedCommits = cache(
  async (
    userId: string,
    project?: string | null
  ): Promise<CachedCommitsResult> => {
    const supabase = await createClient();

    // Build query
    let query = supabase
      .from("cognitive_commits")
      .select(
        `
        *,
        sessions (
          *,
          turns (*)
        )
      `
      )
      .eq("user_id", userId)
      .is("deleted_at", null)
      .eq("hidden", false)
      .order("closed_at", { ascending: false });

    if (project) {
      query = query.eq("project_name", project);
    }

    const { data: rawCommits, error } = await query;

    if (error) {
      console.error("Failed to fetch commits:", error);
      return { commits: [], projects: [], totalCount: 0 };
    }

    // Transform and filter commits
    const allCommits = ((rawCommits as DbCommitWithRelations[]) || []).map(
      transformCommitWithRelations
    );

    const commits = allCommits.filter((c) => {
      // Filter out 0-turn commits
      if ((c.turnCount ?? 0) === 0) return false;
      // Filter out warmup commits
      const firstUserMessage = c.sessions[0]?.turns[0]?.content || "";
      if (firstUserMessage.toLowerCase().includes("warmup")) return false;
      return true;
    });

    // Build projects list (only if not filtering by project)
    let projects: ProjectListItem[] = [];
    if (!project) {
      const projectCounts = new Map<string, number>();
      for (const commit of commits) {
        if (commit.projectName) {
          projectCounts.set(
            commit.projectName,
            (projectCounts.get(commit.projectName) || 0) + 1
          );
        }
      }
      projects = Array.from(projectCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    }

    return {
      commits,
      projects,
      totalCount: commits.length,
    };
  }
);
