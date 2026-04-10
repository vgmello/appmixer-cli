import type { Command } from "@commander-js/extra-typings";
import chalk from "chalk";
import { loadConfig, saveConfig } from "../../config.ts";

export function registerUse(context: Command) {
  context
    .command("use")
    .description("Set the active context")
    .argument("<name>", "Context name")
    .action(async (name) => {
      try {
        const config = await loadConfig();
        if (!config.contexts[name]) {
          const known = Object.keys(config.contexts);
          const suffix = known.length ? ` Known contexts: ${known.join(", ")}.` : "";
          console.error(`Error: context '${name}' does not exist.${suffix}`);
          process.exit(1);
        }
        config.activeContext = name;
        await saveConfig(config);
        console.error(chalk.green(`Switched to context: ${name}`));
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
