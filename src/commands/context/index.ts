import type { Command } from "@commander-js/extra-typings";
import { registerSet } from "./set.ts";
import { registerUse } from "./use.ts";
import { registerList } from "./list.ts";
import { registerCurrent } from "./current.ts";
import { registerDelete } from "./delete.ts";

export function registerContext(program: Command) {
  const context = program
    .command("context")
    .description("Manage named environment contexts");
  registerSet(context);
  registerUse(context);
  registerList(context);
  registerCurrent(context);
  registerDelete(context);
}
