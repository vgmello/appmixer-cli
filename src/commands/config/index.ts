import type { Command } from "@commander-js/extra-typings";
import { registerGetAll } from "./get-all.ts";

export function registerConfig(program: Command) {
  const config = program.command("config").description("Manage configuration");
  registerGetAll(config);
}
