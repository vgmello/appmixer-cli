import type { Command } from "@commander-js/extra-typings";
import { Document, visit } from "yaml";
import { join } from "node:path";
import { mkdir } from "node:fs/promises";
import ora from "ora";
import { client } from "../../client.ts";
import { camelToKebab } from "../../transforms.ts";

export function buildProvisionYaml(domain: string, data: unknown): string {
  const transformed = camelToKebab(data);
  const doc = new Document({ [domain]: transformed });
  visit(doc, {
    Scalar(_, node) {
      if (typeof node.value === "string" && node.value.includes(":")) {
        node.type = "QUOTE_DOUBLE";
      }
    },
  });
  return String(doc);
}

export function registerImport(provision: Command) {
  provision
    .command("import")
    .description("Import current server state as YAML provisioning files")
    .argument("<directory>", "Directory to write YAML files to")
    .action(async (directory) => {
      try {
        await mkdir(directory, { recursive: true });
        let hasFailures = false;

        // Import config
        const configSpinner = ora("Importing config...").start();
        try {
          const config = await client.get("/config");
          const yaml = buildProvisionYaml("config", config);
          await Bun.write(join(directory, "config.yaml"), yaml);
          configSpinner.succeed("Imported config.yaml");
        } catch (err) {
          configSpinner.fail(`Failed to import config: ${(err as Error).message}`);
          hasFailures = true;
        }

        // Import service-config
        const scSpinner = ora("Importing service-config...").start();
        try {
          const serviceConfig = await client.get("/service-config");
          const yaml = buildProvisionYaml("service-config", serviceConfig);
          await Bun.write(join(directory, "service-config.yaml"), yaml);
          scSpinner.succeed("Imported service-config.yaml");
        } catch (err) {
          scSpinner.fail(`Failed to import service-config: ${(err as Error).message}`);
          hasFailures = true;
        }

        // Import ACL
        const aclSpinner = ora("Importing acl...").start();
        try {
          const types = (await client.get("/acl-types")) as string[];
          const acl: Record<string, unknown> = {};
          for (const type of types) {
            acl[type] = await client.get(`/acl/${type}`);
          }
          const yaml = buildProvisionYaml("acl", acl);
          await Bun.write(join(directory, "acl.yaml"), yaml);
          aclSpinner.succeed("Imported acl.yaml");
        } catch (err) {
          aclSpinner.fail(`Failed to import acl: ${(err as Error).message}`);
          hasFailures = true;
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
