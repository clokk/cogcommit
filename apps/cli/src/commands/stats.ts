/**
 * Stats Command
 * Show statistics about cognitive commits
 */

import { Command } from "commander";
import { ensureGlobalStorageDir } from "../config";
import { CogCommitDB } from "../storage/db";

export function registerStatsCommand(program: Command): void {
  program
    .command("stats")
    .description("Show statistics about cognitive commits")
    .option("-p, --project <name>", "Filter by project name")
    .option("--json", "Output as JSON")
    .action(async (options) => {
      const storagePath = ensureGlobalStorageDir();
      const db = new CogCommitDB(storagePath, { rawStoragePath: true });

      try {
        const stats = db.commits.getStats(options.project);

        if (options.json) {
          console.log(JSON.stringify(stats, null, 2));
        } else {
          console.log("\nCogCommit Statistics\n");
          console.log(`Total commits:     ${stats.totalCommits}`);
          console.log(`Total sessions:    ${stats.totalSessions}`);
          console.log(`Total turns:       ${stats.totalTurns}`);
          console.log(`Projects:          ${stats.projectCount}`);

          if (Object.keys(stats.bySource).length > 0) {
            console.log(`\nBy source:`);
            for (const [source, count] of Object.entries(stats.bySource)) {
              console.log(`  ${source}: ${count}`);
            }
          }

          if (stats.topProjects.length > 0) {
            console.log(`\nTop projects:`);
            for (const proj of stats.topProjects.slice(0, 5)) {
              console.log(`  ${proj.name}: ${proj.count} commits`);
            }
          }

          if (stats.firstCommit || stats.lastCommit) {
            console.log(`\nTime range:`);
            if (stats.firstCommit) {
              console.log(`  First: ${new Date(stats.firstCommit).toLocaleDateString()}`);
            }
            if (stats.lastCommit) {
              console.log(`  Last:  ${new Date(stats.lastCommit).toLocaleDateString()}`);
            }
          }

          console.log();
        }
      } finally {
        db.close();
      }
    });
}
