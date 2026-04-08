import type { Command } from "@commander-js/extra-typings";
import { Glob, YAML } from "bun";
import ora from "ora";
import { join } from "node:path";
import { client } from "../../client.ts";
import { kebabToCamel } from "../../transforms.ts";

interface ProvisionData {
  config?: Array<{ key: string; value: unknown }>;
  serviceConfig?: Array<Record<string, unknown>>;
  acl?: Record<string, Array<Record<string, unknown>>>;
}

export async function parseProvisionFiles(directory: string): Promise<ProvisionData> {
  const result: ProvisionData = {};
  const glob = new Glob("**/*.{yaml,yml}");

  const files: string[] = [];
  for await (const file of glob.scan(directory)) {
    files.push(file);
  }
  files.sort();

  for (const file of files) {
    const content = await Bun.file(join(directory, file)).text();
    const parsed = YAML.parse(content) as Record<string, unknown>;
    const transformed = kebabToCamel(parsed) as Record<string, unknown>;

    if (transformed.config) {
      result.config = [
        ...(result.config ?? []),
        ...(transformed.config as ProvisionData["config"])!,
      ];
    }
    if (transformed.serviceConfig) {
      result.serviceConfig = [
        ...(result.serviceConfig ?? []),
        ...(transformed.serviceConfig as ProvisionData["serviceConfig"])!,
      ];
    }
    if (transformed.acl) {
      const acl = transformed.acl as Record<string, Array<Record<string, unknown>>>;
      result.acl = result.acl ?? {};
      for (const [type, rules] of Object.entries(acl)) {
        result.acl[type] = [...(result.acl[type] ?? []), ...rules];
      }
    }
  }

  return result;
}

export function registerApply(provision: Command) {
  provision
    .command("apply")
    .description("Apply provisioning YAML files to the server")
    .argument("<directory>", "Directory containing YAML provisioning files")
    .action(async (directory) => {
      try {
        const data = await parseProvisionFiles(directory);
        let hasFailures = false;

        if (data.config) {
          for (const entry of data.config) {
            const spinner = ora(`Creating config: ${entry.key}`).start();
            try {
              await client.post("/config", entry);
              spinner.succeed(`Created config: ${entry.key}`);
            } catch (err) {
              spinner.fail(`Failed config: ${entry.key} — ${(err as Error).message}`);
              hasFailures = true;
            }
          }
        }

        if (data.serviceConfig) {
          for (const entry of data.serviceConfig) {
            const id = entry.serviceId as string;
            const spinner = ora(`Creating service-config: ${id}`).start();
            try {
              await client.post("/service-config", entry);
              spinner.succeed(`Created service-config: ${id}`);
            } catch (err) {
              spinner.fail(`Failed service-config: ${id} — ${(err as Error).message}`);
              hasFailures = true;
            }
          }
        }

        if (data.acl) {
          for (const [type, rules] of Object.entries(data.acl)) {
            const spinner = ora(`Updating ACL: ${type}`).start();
            try {
              await client.post(`/acl/${type}`, rules);
              spinner.succeed(`Updated ACL: ${type}`);
            } catch (err) {
              spinner.fail(`Failed ACL: ${type} — ${(err as Error).message}`);
              hasFailures = true;
            }
          }
        }

        if (hasFailures) {
          process.exit(1);
        }
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
