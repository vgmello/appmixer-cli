import type { Command } from "@commander-js/extra-typings";
import { Glob } from "bun";
import { join } from "node:path";
import type { LocalFile } from "./diff.ts";

export async function loadLocalFlows(directory: string): Promise<LocalFile[]> {
  const glob = new Glob("*.json");
  const files: string[] = [];
  for await (const file of glob.scan(directory)) {
    files.push(file);
  }
  files.sort();

  const loaded: LocalFile[] = [];
  const seen = new Map<string, string>();

  for (const file of files) {
    const fullPath = join(directory, file);
    const text = await Bun.file(fullPath).text();
    let content: Record<string, unknown>;
    try {
      content = JSON.parse(text);
    } catch (err) {
      throw new Error(`Invalid JSON in ${file}: ${(err as Error).message}`);
    }

    const id = content.flowId;
    if (typeof id === "string") {
      const prior = seen.get(id);
      if (prior) {
        throw new Error(
          `Duplicate flowId ${id} in ${file} (also in ${prior})`
        );
      }
      seen.set(id, file);
    }

    loaded.push({ path: fullPath, content });
  }

  return loaded;
}

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
