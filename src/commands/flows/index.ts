import type { Command } from "@commander-js/extra-typings";
import { registerApply } from "./apply.ts";
import { registerImport } from "./import.ts";

export function registerFlows(program: Command) {
  const flows = program
    .command("flows")
    .description("Manage Appmixer flows as desired-state JSON files");
  registerApply(flows);
  registerImport(flows);
}
