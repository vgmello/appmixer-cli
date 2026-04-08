import type { Command } from "@commander-js/extra-typings";
import { registerTypes } from "./types.ts";
import { registerResources } from "./resources.ts";
import { registerActions } from "./actions.ts";
import { registerAttributes } from "./attributes.ts";
import { registerRules } from "./rules/index.ts";

export function registerAcl(program: Command) {
  const acl = program.command("acl").description("Manage access control lists");
  registerTypes(acl);
  registerResources(acl);
  registerActions(acl);
  registerAttributes(acl);
  registerRules(acl);
}
