import type { Command } from "@commander-js/extra-typings";
import chalk from "chalk";
import { createInterface } from "node:readline";
import { loadConfig, saveConfig } from "../../config.ts";

async function confirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  try {
    const answer: string = await new Promise((resolve) => {
      rl.question(`${question} `, resolve);
    });
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}

export function registerDelete(context: Command) {
  context
    .command("delete")
    .description("Delete a context")
    .argument("<name>", "Context name")
    .option("--yes", "Skip confirmation", false)
    .action(async (name, opts) => {
      try {
        const config = await loadConfig();
        if (!config.contexts[name]) {
          console.error(`Error: context '${name}' does not exist.`);
          process.exit(1);
        }

        if (!opts.yes) {
          if (!process.stdin.isTTY) {
            console.error(
              "Error: refusing to delete context in a non-interactive shell without --yes."
            );
            process.exit(1);
          }
          const ok = await confirm(`Delete context '${name}'? [y/N]`);
          if (!ok) {
            console.error("Aborted.");
            return;
          }
        }

        const wasActive = config.activeContext === name;
        delete config.contexts[name];
        if (wasActive) {
          config.activeContext = null;
        }
        await saveConfig(config);

        console.error(chalk.green(`Deleted context: ${name}`));
        if (wasActive) {
          console.error(
            chalk.yellow("Deleted active context. Run 'context use <name>' to pick a new one.")
          );
        }
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
