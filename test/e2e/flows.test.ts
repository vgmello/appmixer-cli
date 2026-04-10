import { test, expect, describe } from "bun:test";
import { setupMockServer, runCli } from "./helpers.ts";
import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("flows e2e", () => {
  setupMockServer();

  test("flows import writes a single flow to the output file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "flows-import-"));
    const out = join(dir, "seed1.json");

    const result = await runCli("flows", "import", "flow-seed-1", "--output", out);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Wrote");

    const written = JSON.parse(await Bun.file(out).text());
    expect(written.flowId).toBe("flow-seed-1");
    expect(written.name).toBe("Seed Flow One");
    expect(written.sharedWith).toEqual([{ user: "alice", permissions: ["read"] }]);
  });

  test("flows import fails non-zero on unknown flow id", async () => {
    const dir = await mkdtemp(join(tmpdir(), "flows-import-"));
    const out = join(dir, "missing.json");

    const result = await runCli("flows", "import", "no-such-flow", "--output", out);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Failed to import no-such-flow");
  });

  test("flows apply prints a plan and exits 'No changes' when synced", async () => {
    const dir = await mkdtemp(join(tmpdir(), "flows-plan-"));
    const result = await runCli("flows", "apply", dir, "--yes");
    // Empty local + no --prune means everything is a no-op
    expect(result.stderr).toContain("No changes.");
    expect(result.exitCode).toBe(0);
  });

  test("flows apply refuses to run without --yes in a non-tty", async () => {
    const dir = await mkdtemp(join(tmpdir(), "flows-tty-"));
    // Author a brand-new flow so the plan is non-empty
    await Bun.write(join(dir, "new.json"), JSON.stringify({ name: "fresh" }));

    const result = await runCli("flows", "apply", dir);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("non-interactive shell");
  });

  test("flows apply creates a new flow and writes flowId back", async () => {
    const dir = await mkdtemp(join(tmpdir(), "flows-create-"));
    const file = join(dir, "new.json");
    await Bun.write(
      file,
      JSON.stringify({ name: "Brand new", flow: { components: {} } }, null, 2)
    );

    const result = await runCli("flows", "apply", dir, "--yes");
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("create  " + file);
    expect(result.stderr).toContain("Created " + file);

    const after = JSON.parse(await Bun.file(file).text());
    expect(typeof after.flowId).toBe("string");
    expect(after.flowId).toMatch(/^flow-/);
    expect(after.name).toBe("Brand new");
  });

  test("flows apply updates an existing flow and preserves sharedWith", async () => {
    const dir = await mkdtemp(join(tmpdir(), "flows-update-"));
    const file = join(dir, "seed1.json");

    // First import the seed flow
    const importResult = await runCli("flows", "import", "flow-seed-1", "--output", file);
    expect(importResult.exitCode).toBe(0);

    // Edit the local copy: change name, blow away sharedWith locally
    const local = JSON.parse(await Bun.file(file).text());
    local.name = "Renamed Locally";
    local.sharedWith = [];
    await Bun.write(file, JSON.stringify(local, null, 2));

    // Apply
    const applyResult = await runCli("flows", "apply", dir, "--yes");
    expect(applyResult.exitCode).toBe(0);
    expect(applyResult.stderr).toContain("Updated flow-seed-1");

    // Re-import to confirm: name changed, sharedWith preserved by server
    const after = join(dir, "after.json");
    await runCli("flows", "import", "flow-seed-1", "--output", after);
    const imported = JSON.parse(await Bun.file(after).text());
    expect(imported.name).toBe("Renamed Locally");
    expect(imported.sharedWith).toEqual([{ user: "alice", permissions: ["read"] }]);
  });

  test("flows apply blocks updating a running flow without --force", async () => {
    const dir = await mkdtemp(join(tmpdir(), "flows-running-"));
    const file = join(dir, "seed2.json");
    await runCli("flows", "import", "flow-seed-2", "--output", file);

    const local = JSON.parse(await Bun.file(file).text());
    local.name = "Trying to update";
    await Bun.write(file, JSON.stringify(local, null, 2));

    const result = await runCli("flows", "apply", dir, "--yes");
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("flow is running");
    expect(result.stderr).toContain("--force");
  });

  test("flows apply with --force updates a running flow", async () => {
    const dir = await mkdtemp(join(tmpdir(), "flows-force-"));
    const file = join(dir, "seed2.json");
    await runCli("flows", "import", "flow-seed-2", "--output", file);

    const local = JSON.parse(await Bun.file(file).text());
    local.name = "Forced update";
    await Bun.write(file, JSON.stringify(local, null, 2));

    const result = await runCli("flows", "apply", dir, "--yes", "--force");
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Updated flow-seed-2");
  });
});
