import type { Command } from "@commander-js/extra-typings";
import { Glob } from "bun";
import { join } from "node:path";
import { createInterface } from "node:readline";
import chalk from "chalk";
import ora from "ora";
import { client } from "../../client.ts";
import { computePlan, type Flow, type Plan, PRESERVE_FROM_REMOTE } from "./diff.ts";
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

async function confirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  try {
    const answer: string = await new Promise((resolve) => {
      rl.question(`${question} `, resolve);
    });
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}

function isPlanEmpty(plan: Plan): boolean {
  return (
    plan.creates.length === 0 &&
    plan.updates.length === 0 &&
    plan.prunes.length === 0
  );
}

interface ExecuteOptions {
  force: boolean;
}

interface ExecuteResult {
  successes: number;
  failures: number;
}

async function executeCreates(plan: Plan): Promise<ExecuteResult> {
  let successes = 0;
  let failures = 0;

  for (const entry of plan.creates) {
    const label = entry.staleId
      ? `Creating ${entry.path} (replacing stale ${entry.staleId})`
      : `Creating ${entry.path}`;
    const spinner = ora(label).start();

    const body = { ...entry.content };
    delete body.flowId;

    try {
      const created = (await client.post("/flows", body)) as Flow;
      const newId = created.flowId;
      if (typeof newId !== "string") {
        throw new Error("Server response missing flowId");
      }

      const updatedFile = { ...entry.content, flowId: newId };
      try {
        await Bun.write(entry.path, JSON.stringify(updatedFile, null, 2) + "\n");
      } catch (err) {
        spinner.fail(
          `Created flow ${newId} remotely but FAILED to write ${entry.path}: ${(err as Error).message}. ` +
            `You must record this ID manually before re-running apply.`
        );
        failures++;
        continue;
      }

      spinner.succeed(`Created ${entry.path} → ${newId}`);
      successes++;
    } catch (err) {
      spinner.fail(`Failed to create ${entry.path}: ${(err as Error).message}`);
      failures++;
    }
  }

  return { successes, failures };
}

async function executeUpdates(
  plan: Plan,
  options: ExecuteOptions
): Promise<ExecuteResult> {
  let successes = 0;
  let failures = 0;

  for (const entry of plan.updates) {
    const id = String(entry.content.flowId);
    const spinner = ora(`Updating ${entry.path} (${id})`).start();

    if (entry.remote.stage === "running" && !options.force) {
      spinner.fail(
        `Skipped ${id}: flow is running. Re-run with --force to update running flows.`
      );
      failures++;
      continue;
    }

    const body: Flow = { ...entry.content };
    for (const field of PRESERVE_FROM_REMOTE) {
      if (field in entry.remote) {
        body[field] = entry.remote[field];
      } else {
        delete body[field];
      }
    }

    const path = options.force
      ? `/flows/${encodeURIComponent(id)}?forceUpdate=true`
      : `/flows/${encodeURIComponent(id)}`;

    try {
      await client.put(path, body);
      spinner.succeed(`Updated ${id}`);
      successes++;
    } catch (err) {
      spinner.fail(`Failed to update ${id}: ${(err as Error).message}`);
      failures++;
    }
  }

  return { successes, failures };
}

async function executePrunes(plan: Plan): Promise<ExecuteResult> {
  let successes = 0;
  let failures = 0;

  for (const entry of plan.prunes) {
    const spinner = ora(`Pruning ${entry.flowId} (${entry.name})`).start();
    try {
      await client.delete(`/flows/${encodeURIComponent(entry.flowId)}`);
      spinner.succeed(`Pruned ${entry.flowId}`);
      successes++;
    } catch (err) {
      spinner.fail(`Failed to prune ${entry.flowId}: ${(err as Error).message}`);
      failures++;
    }
  }

  return { successes, failures };
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

        if (!opts.yes) {
          if (!process.stdin.isTTY) {
            console.error(
              "Error: refusing to run without --yes in a non-interactive shell."
            );
            process.exit(1);
          }
          const ok = await confirm("Apply these changes? [y/N]");
          if (!ok) {
            console.error("Aborted.");
            return;
          }
        }

        const create = await executeCreates(plan);
        const update = await executeUpdates(plan, { force: opts.force });
        const prune = await executePrunes(plan);

        const successes = create.successes + update.successes + prune.successes;
        const failures = create.failures + update.failures + prune.failures;
        const total = successes + failures;
        console.error(`\nDone: ${successes}/${total} succeeded`);
        if (failures > 0) process.exit(1);
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
