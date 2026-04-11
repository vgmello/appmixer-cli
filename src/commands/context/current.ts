import type { Command } from "@commander-js/extra-typings";
import { loadConfig } from "../../config.ts";

export function registerCurrent(context: Command) {
  context
    .command("current")
    .description("Print the active context name")
    .action(async () => {
      try {
        const config = await loadConfig();
        if (!config.activeContext) {
          console.error("Error: no active context. Run 'context use <name>' to set one.");
          process.exit(1);
        }
        console.log(config.activeContext);
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
