import type { Command } from "@commander-js/extra-typings";
import { Glob } from "bun";
import { join } from "node:path";
import chalk from "chalk";
import { client } from "../../client.ts";
import { computePlan, type Flow, type Plan } from "./diff.ts";
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

export function formatPlan(plan: Plan): string {
  const lines: string[] = [];
  for (const c of plan.creates) {
    const tag = c.staleId ? ` (stale id replaced: ${c.staleId})` : "";
    lines.push(chalk.green(`  + create  ${c.path}${tag}`));
  }
  for (const u of plan.updates) {
    lines.push(chalk.yellow(`  ~ update  ${u.path}  (${u.content.flowId})`));
  }
  for (const p of plan.prunes) {
    lines.push(chalk.red(`  - prune   ${p.flowId}  (${p.name})`));
  }
  for (const s of plan.skips) {
    lines.push(chalk.dim(`  = skip    ${s.path}`));
  }
  lines.push("");
  lines.push(
    `Plan: ${plan.creates.length} create, ${plan.updates.length} update, ${plan.prunes.length} prune, ${plan.skips.length} skip`
  );
  return lines.join("\n");
}

function isPlanEmpty(plan: Plan): boolean {
  return (
    plan.creates.length === 0 &&
    plan.updates.length === 0 &&
    plan.prunes.length === 0
  );
}

export function registerApply(flows: Command) {
  flows
    .command("apply")
    .description("Apply flow JSON files to the server (desired state)")
    .argument("<directory>", "Directory containing flow JSON files")
    .option("--prune", "Delete remote flows not present locally", false)
    .option("--force", "Allow updating running flows (passes forceUpdate)", false)
    .option("--yes", "Skip the confirmation prompt", false)
    .action(async (directory, opts) => {
      try {
        const localFiles = await loadLocalFlows(directory);
        const remoteFlows = (await client.get("/flows")) as Flow[];
        const plan = computePlan(localFiles, remoteFlows, { prune: opts.prune });

        console.error(formatPlan(plan));

        if (isPlanEmpty(plan)) {
          console.error("No changes.");
          return;
        }

        // Execution lands in the next task
        console.error("(execution not yet implemented)");
        process.exit(1);
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
