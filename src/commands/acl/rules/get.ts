import type { Command } from "@commander-js/extra-typings";
import { client } from "../../../client.ts";

export function registerGet(rules: Command) {
  rules
    .command("get")
    .description("List ACL rules for a type")
    .argument("<type>", 'ACL type (e.g. "components" or "routes")')
    .action(async (type) => {
      try {
        const data = await client.get(`/acl/${type}`);
        console.log(JSON.stringify(data, null, 2));
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
