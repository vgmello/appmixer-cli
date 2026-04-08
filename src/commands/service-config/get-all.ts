import type { Command } from "@commander-js/extra-typings";
import { client } from "../../client.ts";

export function registerGetAll(serviceConfig: Command) {
  serviceConfig
    .command("get-all")
    .description("List all service configurations")
    .option("--pattern <pattern>", "Filter by service ID pattern")
    .option("--sort <sort>", "Sort by field (e.g. serviceId:1)")
    .option("--offset <offset>", "Pagination start index", "0")
    .option("--limit <limit>", "Max items returned", "100")
    .action(async (opts) => {
      try {
        const params = new URLSearchParams();
        if (opts.pattern) params.set("pattern", opts.pattern);
        if (opts.sort) params.set("sort", opts.sort);
        params.set("offset", opts.offset);
        params.set("limit", opts.limit);

        const query = params.toString();
        const path = `/service-config${query ? `?${query}` : ""}`;
        const data = await client.get(path);
        console.log(JSON.stringify(data, null, 2));
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
