import type { Command } from "@commander-js/extra-typings";
import { client } from "../../client.ts";

export function registerGet(serviceConfig: Command) {
  serviceConfig
    .command("get")
    .description("Get a single service configuration")
    .argument("<serviceId>", 'Service ID (e.g. "appmixer:google")')
    .action(async (serviceId) => {
      try {
        const data = await client.get(`/service-config/${serviceId}`);
        console.log(JSON.stringify(data, null, 2));
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
