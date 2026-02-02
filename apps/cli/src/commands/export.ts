/**
 * Export Command
 * Export commits to JSON or Markdown
 */

import { Command } from "commander";
import * as fs from "fs";
import { ensureGlobalStorageDir } from "../config";
import { CogCommitDB } from "../storage/db";
import type { CognitiveCommit } from "../models/types";

export function registerExportCommand(program: Command): void {
  program
    .command("export")
    .description("Export commits to JSON or Markdown")
    .option("-f, --format <format>", "Output format: json or markdown", "json")
    .option("-o, --output <path>", "Output file path")
    .option("-p, --project <name>", "Filter by project name")
    .option("--limit <n>", "Limit number of commits", parseInt)
    .action(async (options) => {
      const storagePath = ensureGlobalStorageDir();
      const db = new CogCommitDB(storagePath, { rawStoragePath: true });

      try {
        let commits = options.project
          ? db.commits.getByProject(options.project)
          : db.commits.getAll();

        if (options.limit) {
          commits = commits.slice(0, options.limit);
        }

        let output: string;
        if (options.format === "markdown") {
          output = formatAsMarkdown(commits);
        } else {
          output = JSON.stringify(commits, null, 2);
        }

        if (options.output) {
          fs.writeFileSync(options.output, output);
          console.log(`Exported ${commits.length} commits to ${options.output}`);
        } else {
          console.log(output);
        }
      } finally {
        db.close();
      }
    });
}

function formatAsMarkdown(commits: CognitiveCommit[]): string {
  let md = "# Cognitive Commits Export\n\n";

  for (const commit of commits) {
    const title = commit.title || commit.id.substring(0, 8);
    const closedDate = commit.closedAt
      ? new Date(commit.closedAt).toLocaleDateString()
      : "Unknown";

    md += `## ${title}\n\n`;
    md += `- **Project**: ${commit.projectName || "Unknown"}\n`;
    md += `- **Date**: ${closedDate}\n`;
    md += `- **Git Hash**: ${commit.gitHash || "None"}\n`;
    md += `- **Source**: ${commit.source || "claude_code"}\n\n`;

    if (commit.filesChanged && commit.filesChanged.length > 0) {
      md += `### Files Changed\n\n`;
      for (const file of commit.filesChanged.slice(0, 10)) {
        md += `- ${file}\n`;
      }
      if (commit.filesChanged.length > 10) {
        md += `- ... and ${commit.filesChanged.length - 10} more\n`;
      }
      md += "\n";
    }

    for (const session of commit.sessions) {
      md += `### Session\n\n`;
      for (const turn of session.turns) {
        const roleLabel = turn.role === "user" ? "**User**" : "**Assistant**";
        const content = turn.content.length > 500
          ? turn.content.substring(0, 500) + "..."
          : turn.content;
        md += `${roleLabel}: ${content}\n\n`;
      }
    }
    md += "---\n\n";
  }

  return md;
}
