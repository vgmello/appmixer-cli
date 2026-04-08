import type { Command } from "@commander-js/extra-typings";
import { client } from "../../client.ts";

export function registerResources(acl: Command) {
  const resources = acl.command("resources").description("Manage ACL resources");
  resources
    .command("get")
    .description("List available resources for an ACL type")
    .argument("<type>", 'ACL type (e.g. "components" or "routes")')
    .action(async (type) => {
      try {
        const data = await client.get(`/acl/${type}/resources`);
        console.log(JSON.stringify(data, null, 2));
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
