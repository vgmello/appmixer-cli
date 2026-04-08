import type { Command } from "@commander-js/extra-typings";
import { client } from "../../client.ts";

export function registerGetAll(config: Command) {
  config
    .command("get-all")
    .description("List all configuration key/value pairs")
    .action(async () => {
      try {
        const data = await client.get("/config");
        console.log(JSON.stringify(data, null, 2));
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
