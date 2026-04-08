import type { Command } from "@commander-js/extra-typings";
import { registerGet } from "./get.ts";

export function registerRules(acl: Command) {
  const rules = acl.command("rules").description("Manage ACL rules");
  registerGet(rules);
}
