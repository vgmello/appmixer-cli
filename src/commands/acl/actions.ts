import type { Command } from "@commander-js/extra-typings";
import { client } from "../../client.ts";

export function registerActions(acl: Command) {
  const actions = acl.command("actions").description("Manage ACL actions");
  actions
    .command("get")
    .description("List available actions for an ACL type")
    .argument("<type>", 'ACL type (e.g. "components" or "routes")')
    .action(async (type) => {
      try {
        const data = await client.get(`/acl/${type}/actions`);
        console.log(JSON.stringify(data, null, 2));
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
