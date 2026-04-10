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
});
