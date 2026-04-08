import type { Command } from "@commander-js/extra-typings";
import { registerGetAll } from "./get-all.ts";
import { registerGet } from "./get.ts";

export function registerServiceConfig(program: Command) {
  const serviceConfig = program
    .command("service-config")
    .description("Manage connector service configurations");
  registerGetAll(serviceConfig);
  registerGet(serviceConfig);
}
