import { test, expect, describe } from "bun:test";
import { setupMockServer, runCli, getBaseUrl } from "./helpers.ts";
import { mkdtemp, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { YAML } from "bun";

describe("provision e2e", () => {
  setupMockServer();

  test("provision apply pushes YAML config to server", async () => {
    const dir = await mkdtemp(join(tmpdir(), "provision-apply-"));
    await writeFile(
      join(dir, "config.yaml"),
      'config:\n  - key: "NEW_KEY"\n    value: "new_value"\n'
    );

    const applyResult = await runCli("provision", "apply", dir);
    expect(applyResult.exitCode).toBe(0);
    expect(applyResult.stderr).toContain("Created config: NEW_KEY");

    // Verify the config was added by reading it back
    const getResult = await runCli("config", "get-all");
    const data = JSON.parse(getResult.stdout);
    const newEntry = data.find((c: { key: string }) => c.key === "NEW_KEY");
    expect(newEntry).toBeDefined();
    expect(newEntry.value).toBe("new_value");
  });

  test("provision apply pushes service-config to server", async () => {
    const dir = await mkdtemp(join(tmpdir(), "provision-apply-"));
    await writeFile(
      join(dir, "services.yaml"),
      'service-config:\n  - service-id: "appmixer:github"\n    client-id: "gh-123"\n'
    );

    const applyResult = await runCli("provision", "apply", dir);
    expect(applyResult.exitCode).toBe(0);
    expect(applyResult.stderr).toContain("Created service-config: appmixer:github");
  });

  test("provision apply pushes acl rules to server", async () => {
    const dir = await mkdtemp(join(tmpdir(), "provision-apply-"));
    await writeFile(
      join(dir, "acl.yaml"),
      'acl:\n  components:\n    - role: "viewer"\n      resource: "*"\n      action: ["read"]\n'
    );

    const applyResult = await runCli("provision", "apply", dir);
    expect(applyResult.exitCode).toBe(0);
    expect(applyResult.stderr).toContain("Updated ACL: components");

    // Verify ACL was updated
    const getResult = await runCli("acl", "rules", "get", "components");
    const data = JSON.parse(getResult.stdout);
    expect(data[0].role).toBe("viewer");
  });

  test("provision import writes YAML files from server state", async () => {
    const dir = await mkdtemp(join(tmpdir(), "provision-import-"));

    const result = await runCli("provision", "import", dir);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Imported config.yaml");
    expect(result.stderr).toContain("Imported service-config.yaml");
    expect(result.stderr).toContain("Imported acl.yaml");

    // Verify files were created
    const files = await readdir(dir);
    expect(files).toContain("config.yaml");
    expect(files).toContain("service-config.yaml");
    expect(files).toContain("acl.yaml");

    // Verify config.yaml content
    const configContent = await Bun.file(join(dir, "config.yaml")).text();
    const configData = YAML.parse(configContent);
    expect(configData.config).toBeArray();
    expect(configData.config.length).toBe(2);
  });

  test("provision round-trip: apply then import produces matching data", async () => {
    // Create YAML fixtures
    const applyDir = await mkdtemp(join(tmpdir(), "provision-rt-apply-"));
    await writeFile(
      join(applyDir, "config.yaml"),
      'config:\n  - key: "RT_KEY"\n    value: "rt_value"\n'
    );
    await writeFile(
      join(applyDir, "services.yaml"),
      'service-config:\n  - service-id: "appmixer:rt-test"\n    client-id: "rt-123"\n'
    );

    // Apply
    const applyResult = await runCli("provision", "apply", applyDir);
    expect(applyResult.exitCode).toBe(0);

    // Import
    const importDir = await mkdtemp(join(tmpdir(), "provision-rt-import-"));
    const importResult = await runCli("provision", "import", importDir);
    expect(importResult.exitCode).toBe(0);

    // Verify the imported config contains the applied data
    const configContent = await Bun.file(join(importDir, "config.yaml")).text();
    const configData = YAML.parse(configContent);
    const rtEntry = configData.config.find((c: { key: string }) => c.key === "RT_KEY");
    expect(rtEntry).toBeDefined();
    expect(rtEntry.value).toBe("rt_value");

    // Verify the imported service-config contains the applied data
    const scContent = await Bun.file(join(importDir, "service-config.yaml")).text();
    const scData = YAML.parse(scContent);
    const rtService = scData["service-config"].find(
      (s: Record<string, unknown>) => s["service-id"] === "appmixer:rt-test"
    );
    expect(rtService).toBeDefined();
    expect(rtService["client-id"]).toBe("rt-123");
  });
});
