import type { Command } from "@commander-js/extra-typings";
import { registerApply } from "./apply.ts";
import { registerImport } from "./import.ts";

export function registerProvision(program: Command) {
  const provision = program
    .command("provision")
    .description("Provision an Appmixer instance from YAML files");
  registerApply(provision);
  registerImport(provision);
}
