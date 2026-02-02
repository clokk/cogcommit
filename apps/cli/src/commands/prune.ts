/**
 * Prune Command
 * Delete old commits from local database
 */

import { Command } from "commander";
import * as readline from "readline";
import { ensureGlobalStorageDir } from "../config";
import { CogCommitDB } from "../storage/db";

export function registerPruneCommand(program: Command): void {
  program
    .command("prune")
    .description("Delete old commits from local database")
    .option(
      "--before <date>",
      "Delete commits before this date (ISO format or relative like '30d')"
    )
    .option("-p, --project <name>", "Only prune from specific project")
    .option("-n, --dry-run", "Show what would be deleted without deleting")
    .option("-y, --yes", "Skip confirmation prompt")
    .action(async (options) => {
      if (!options.before) {
        console.error(
          "Error: --before is required (e.g., --before 30d or --before 2024-01-01)"
        );
        process.exit(1);
      }

      const storagePath = ensureGlobalStorageDir();
      const db = new CogCommitDB(storagePath, { rawStoragePath: true });

      try {
        const beforeDate = parseDate(options.before);
        const commits = db.commits.getBeforeDate(beforeDate, options.project);

        if (commits.length === 0) {
          console.log("No commits found matching criteria.");
          return;
        }

        console.log(`Found ${commits.length} commits to prune.`);

        if (options.dryRun) {
          console.log("\nDry run - would delete:");
          for (const c of commits.slice(0, 10)) {
            const closedDate = c.closedAt
              ? new Date(c.closedAt).toLocaleDateString()
              : "Unknown";
            console.log(
              `  ${c.id.substring(0, 8)} - ${c.projectName || "unknown"} - ${closedDate}`
            );
          }
          if (commits.length > 10) {
            console.log(`  ... and ${commits.length - 10} more`);
          }
          return;
        }

        if (!options.yes) {
          const confirmed = await confirm(
            `Delete ${commits.length} commits? Type 'yes' to confirm: `
          );
          if (!confirmed) {
            console.log("Aborted.");
            return;
          }
        }

        let deleted = 0;
        for (const commit of commits) {
          db.commits.delete(commit.id);
          deleted++;
        }

        console.log(`Deleted ${deleted} commits.`);
      } finally {
        db.close();
      }
    });
}

function parseDate(input: string): string {
  // Handle relative dates like "30d", "7d", "1w", "3m"
  const relativeMatch = input.match(/^(\d+)([dwm])$/);
  if (relativeMatch) {
    const [, num, unit] = relativeMatch;
    const days =
      unit === "d"
        ? parseInt(num)
        : unit === "w"
          ? parseInt(num) * 7
          : parseInt(num) * 30;
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  }
  // Assume ISO date
  return new Date(input).toISOString();
}

async function confirm(prompt: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "yes");
    });
  });
}
