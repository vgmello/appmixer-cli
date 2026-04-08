import type { Command } from "@commander-js/extra-typings";
import { client } from "../../client.ts";

export function registerAttributes(acl: Command) {
  const attributes = acl.command("attributes").description("Manage ACL attributes");
  attributes
    .command("get")
    .description("List attributes for an ACL type and resource")
    .argument("<type>", 'ACL type (e.g. "components" or "routes")')
    .argument("<resource>", "Resource identifier")
    .action(async (type, resource) => {
      try {
        const data = await client.get(`/acl/${type}/resource/${resource}/attributes`);
        console.log(JSON.stringify(data, null, 2));
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
