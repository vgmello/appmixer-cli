import type { Command } from "@commander-js/extra-typings";
import { client } from "../../client.ts";

export function registerTypes(acl: Command) {
  const types = acl.command("types").description("Manage ACL types");
  types
    .command("get")
    .description("List all ACL types")
    .action(async () => {
      try {
        const data = await client.get("/acl-types");
        console.log(JSON.stringify(data, null, 2));
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
