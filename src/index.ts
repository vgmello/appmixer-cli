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
  .option("--username <username>", "Username (overrides APPMIXER_USERNAME)")
  .option("--password <password>", "Password (overrides APPMIXER_PASSWORD)")
  .option("--base-url <url>", "API base URL (overrides APPMIXER_BASE_URL)")
  .action(async (opts) => {
    const username = opts.username ?? process.env.APPMIXER_USERNAME;
    const password = opts.password ?? process.env.APPMIXER_PASSWORD;
    const baseUrl = opts.baseUrl ?? process.env.APPMIXER_BASE_URL;

    if (!username) {
      console.error("Error: --username or APPMIXER_USERNAME is required");
      process.exit(1);
    }
    if (!password) {
      console.error("Error: --password or APPMIXER_PASSWORD is required");
      process.exit(1);
    }
    if (!baseUrl) {
      console.error("Error: --base-url or APPMIXER_BASE_URL is required");
      process.exit(1);
    }

    try {
      await login(baseUrl, username, password);
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
