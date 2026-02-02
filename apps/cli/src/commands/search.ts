/**
 * Search Command
 * Full-text search through conversation content
 */

import { Command } from "commander";
import { ensureGlobalStorageDir } from "../config";
import { CogCommitDB } from "../storage/db";

export function registerSearchCommand(program: Command): void {
  program
    .command("search <query>")
    .description("Search through conversation content")
    .option("-p, --project <name>", "Filter by project name")
    .option("--limit <n>", "Limit results", parseInt, 20)
    .action(async (query, options) => {
      const storagePath = ensureGlobalStorageDir();
      const db = new CogCommitDB(storagePath, { rawStoragePath: true });

      try {
        const results = db.turns.search(query, {
          project: options.project,
          limit: options.limit,
        });

        if (results.length === 0) {
          console.log(`No results found for "${query}"`);
          return;
        }

        console.log(`Found ${results.length} matches for "${query}":\n`);

        for (const result of results) {
          const projectDisplay = result.project_name || "unknown";
          const commitShort = result.commit_id.substring(0, 8);
          console.log(`\x1b[36m${projectDisplay}\x1b[0m - ${commitShort}`);
          console.log(`  ${result.role}: ${highlightMatch(result.content, query)}`);
          console.log();
        }
      } finally {
        db.close();
      }
    });
}

function highlightMatch(content: string, query: string): string {
  const snippet = extractSnippet(content, query, 100);
  return snippet.replace(
    new RegExp(escapeRegExp(query), "gi"),
    (match) => `\x1b[33m${match}\x1b[0m`
  );
}

function extractSnippet(content: string, query: string, chars: number): string {
  const index = content.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) {
    return content.substring(0, chars * 2) + (content.length > chars * 2 ? "..." : "");
  }
  const start = Math.max(0, index - chars / 2);
  const end = Math.min(content.length, index + query.length + chars / 2);
  let snippet = content.substring(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";
  return snippet;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
