import type { Command } from "@commander-js/extra-typings";

export function registerApply(flows: Command) {
  flows
    .command("apply")
    .description("Apply flow JSON files to the server (desired state)")
    .argument("<directory>", "Directory containing flow JSON files")
    .option("--prune", "Delete remote flows not present locally", false)
    .option("--force", "Allow updating running flows (passes forceUpdate)", false)
    .option("--yes", "Skip the confirmation prompt", false)
    .action(async () => {
      console.error("not yet implemented");
      process.exit(1);
    });
}
