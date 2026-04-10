import { test, expect, describe } from "bun:test";
import { loadLocalFlows } from "../src/commands/flows/apply.ts";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("loadLocalFlows", () => {
  test("loads JSON files from a flat directory", async () => {
    const dir = await mkdtemp(join(tmpdir(), "flows-load-"));
    await writeFile(join(dir, "a.json"), JSON.stringify({ flowId: "f1", name: "A" }));
    await writeFile(join(dir, "b.json"), JSON.stringify({ name: "B" }));

    const result = await loadLocalFlows(dir);
    const sorted = result.sort((x, y) => x.path.localeCompare(y.path));
    expect(sorted.length).toBe(2);
    expect(sorted[0]!.content).toEqual({ flowId: "f1", name: "A" });
    expect(sorted[1]!.content).toEqual({ name: "B" });
  });

  test("ignores non-json files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "flows-load-"));
    await writeFile(join(dir, "a.json"), JSON.stringify({ name: "A" }));
    await writeFile(join(dir, "readme.md"), "hello");

    const result = await loadLocalFlows(dir);
    expect(result.length).toBe(1);
  });

  test("throws on invalid JSON, naming the file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "flows-load-"));
    await writeFile(join(dir, "broken.json"), "{not json");

    await expect(loadLocalFlows(dir)).rejects.toThrow(/broken\.json/);
  });

  test("throws on duplicate flowId across files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "flows-load-"));
    await writeFile(join(dir, "a.json"), JSON.stringify({ flowId: "dup", name: "A" }));
    await writeFile(join(dir, "b.json"), JSON.stringify({ flowId: "dup", name: "B" }));

    await expect(loadLocalFlows(dir)).rejects.toThrow(/duplicate flowId.*dup/i);
  });
});
