import { Command } from "@commander-js/extra-typings";
import { login } from "./auth.ts";
import { registerConfig } from "./commands/config/index.ts";
import { registerAcl } from "./commands/acl/index.ts";
import { registerServiceConfig } from "./commands/service-config/index.ts";
import { registerProvision } from "./commands/provision/index.ts";
import { registerFlows } from "./commands/flows/index.ts";

const program = new Command();

program
  .name("appmixer-adm")
  .description("Manage an Appmixer instance via its REST API")
  .version("0.1.0");

program
  .command("login")
  .description("Authenticate with an Appmixer instance")
  .option("--context <name>", "Context name (defaults to the active context)")
  .option("--username <username>", "Username (required when creating a new context)")
  .option("--password <password>", "Password (overrides APPMIXER_PASSWORD; prompts if neither is set)")
  .option("--base-url <url>", "API base URL (required when creating a new context)")
  .action(async (opts) => {
    try {
      await login({
        context: opts.context,
        baseUrl: opts.baseUrl ?? process.env.APPMIXER_BASE_URL,
        username: opts.username ?? process.env.APPMIXER_USERNAME,
        password: opts.password,
      });
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });

registerConfig(program);
registerAcl(program);
registerServiceConfig(program);
registerProvision(program);
registerFlows(program);

program.parse();
