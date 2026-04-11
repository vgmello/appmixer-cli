import type { Command } from "@commander-js/extra-typings";
import chalk from "chalk";
import { loadConfig, saveConfig } from "../../config.ts";

export function registerSet(context: Command) {
  context
    .command("set")
    .description("Create or update a context")
    .argument("<name>", "Context name")
    .requiredOption("--base-url <url>", "API base URL")
    .requiredOption("--username <username>", "Username for this context")
    .action(async (name, opts) => {
      try {
        const config = await loadConfig();
        const existing = config.contexts[name];
        const changedUser = existing && existing.username !== opts.username;

        config.contexts[name] = {
          baseUrl: opts.baseUrl,
          username: opts.username,
          // Clear token if the username changed — the token belongs to the old user.
          ...(changedUser ? {} : existing && existing.token
            ? { token: existing.token, tokenExp: existing.tokenExp }
            : {}),
        };

        await saveConfig(config);

        if (existing) {
          console.error(chalk.green(`Updated context: ${name}`));
          if (changedUser) {
            console.error(
              chalk.yellow(
                `Warning: username changed — previous token cleared. Run 'login --context ${name}' to re-authenticate.`
              )
            );
          }
        } else {
          console.error(chalk.green(`Created context: ${name}`));
        }
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
