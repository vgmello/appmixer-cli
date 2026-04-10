# Flows Desired-State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `flows apply` and `flows import` commands so a folder of JSON files becomes the source of truth for Appmixer flows.

**Architecture:** New `flows` command group parallel to `provision`. A pure `diff.ts` module computes the create/update/skip/prune plan; `apply.ts` is the I/O shell that walks files, prompts for confirmation, calls the API, and writes server-assigned IDs back to disk. `import.ts` is a thin single-flow GET-and-write. Mock server gains flow CRUD routes for tests.

**Tech Stack:** Bun, TypeScript, `@commander-js/extra-typings`, `ora`, `chalk`, `node:readline` (for the y/N prompt). Tests use `bun:test`.

**Spec:** `docs/superpowers/specs/2026-04-10-flows-desired-state-design.md`

---

## File Structure

**Created:**
- `src/commands/flows/index.ts` — registers the `flows` command group
- `src/commands/flows/diff.ts` — pure: strip-field constants, `normalize()`, `computePlan()`, types
- `src/commands/flows/apply.ts` — `flows apply` command, file loading, prompt, execute
- `src/commands/flows/import.ts` — `flows import` command
- `test/flows-diff.test.ts` — unit tests for `diff.ts`
- `test/flows-apply.test.ts` — unit test for the file loader (duplicate detection, invalid JSON)
- `test/e2e/flows.test.ts` — end-to-end against the mock server

**Modified:**
- `src/index.ts` — register `flows` command group (one new import + one call)
- `test/mock-server.ts` — add a `flows` store and routes for `GET /flows`, `GET /flows/:id`, `POST /flows`, `PUT /flows/:id`, `DELETE /flows/:id`

---

## Task 1: Mock server flow routes

Add a flows store and CRUD routes to `test/mock-server.ts` so subsequent tasks can test against a real HTTP surface. Models the bits of the Appmixer flows API the CLI actually uses.

**Files:**
- Modify: `test/mock-server.ts`

- [ ] **Step 1: Extend the `Store` interface and seed data**

In `test/mock-server.ts`, change the `Store` interface and `SEED_DATA` constant:

```ts
interface Flow {
  flowId: string;
  name: string;
  flow: { components?: Record<string, unknown>; connections?: unknown[] };
  userId: string;
  sharedWith: Array<{ user: string; permissions: string[] }>;
  stage: "stopped" | "running";
  btime: number;
  mtime: number;
}

interface Store {
  config: Array<{ key: string; value: unknown }>;
  serviceConfig: Array<Record<string, unknown>>;
  acl: Record<string, Array<Record<string, unknown>>>;
  flows: Flow[];
}

const SEED_DATA: Store = {
  config: [
    { key: "API_URL", value: "https://api.example.com" },
    { key: "LOG_LEVEL", value: "info" },
  ],
  serviceConfig: [
    { serviceId: "appmixer:google", clientId: "google-123", clientSecret: "google-secret" },
    { serviceId: "appmixer:slack", clientId: "slack-456", clientSecret: "slack-secret" },
  ],
  acl: {
    components: [
      { role: "admin", resource: "*", action: ["*"], attributes: ["*"] },
    ],
    routes: [
      { role: "user", resource: "/api/*", action: ["read"], attributes: [] },
    ],
  },
  flows: [
    {
      flowId: "flow-seed-1",
      name: "Seed Flow One",
      flow: { components: {}, connections: [] },
      userId: "owner-user",
      sharedWith: [{ user: "alice", permissions: ["read"] }],
      stage: "stopped",
      btime: 1000,
      mtime: 1000,
    },
    {
      flowId: "flow-seed-2",
      name: "Seed Flow Two (running)",
      flow: { components: {}, connections: [] },
      userId: "owner-user",
      sharedWith: [],
      stage: "running",
      btime: 2000,
      mtime: 2000,
    },
  ],
};
```

- [ ] **Step 2: Add flows route handlers near the bottom of `handleRequest`**

In `test/mock-server.ts`, add these blocks just before the final `return Response.json({ error: "Not found" }, { status: 404 });`:

```ts
  // Flows routes
  if (method === "GET" && path === "/flows") {
    return Response.json(store.flows);
  }
  if (method === "POST" && path === "/flows") {
    return handleFlowCreate(req);
  }
  if (method === "GET" && path.match(/^\/flows\/[^/]+$/)) {
    const id = decodeURIComponent(path.slice("/flows/".length));
    const found = store.flows.find((f) => f.flowId === id);
    if (!found) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(found);
  }
  if (method === "PUT" && path.match(/^\/flows\/[^/]+$/)) {
    return handleFlowUpdate(req, url, path);
  }
  if (method === "DELETE" && path.match(/^\/flows\/[^/]+$/)) {
    const id = decodeURIComponent(path.slice("/flows/".length));
    const before = store.flows.length;
    store.flows = store.flows.filter((f) => f.flowId !== id);
    if (store.flows.length === before) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json({});
  }
```

- [ ] **Step 3: Add the three handler functions at the bottom of the file (before `startServer`)**

In `test/mock-server.ts`:

```ts
let nextFlowId = 1000;

async function handleFlowCreate(req: Request): Promise<Response> {
  const body = (await req.json()) as Partial<Flow>;
  const now = Date.now();
  const created: Flow = {
    flowId: `flow-${nextFlowId++}`,
    name: body.name ?? "Untitled",
    flow: body.flow ?? { components: {}, connections: [] },
    userId: "owner-user",
    sharedWith: [],
    stage: "stopped",
    btime: now,
    mtime: now,
  };
  store.flows.push(created);
  return Response.json(created);
}

async function handleFlowUpdate(req: Request, url: URL, path: string): Promise<Response> {
  const id = decodeURIComponent(path.slice("/flows/".length));
  const idx = store.flows.findIndex((f) => f.flowId === id);
  if (idx === -1) return Response.json({ error: "Not found" }, { status: 404 });

  const current = store.flows[idx]!;
  const force = url.searchParams.get("forceUpdate") === "true";
  if (current.stage === "running" && !force) {
    return Response.json(
      { error: "Flow is running. Pass forceUpdate=true." },
      { status: 409 }
    );
  }

  const body = (await req.json()) as Partial<Flow>;
  store.flows[idx] = {
    ...current,
    name: body.name ?? current.name,
    flow: body.flow ?? current.flow,
    mtime: Date.now(),
  };
  return Response.json(store.flows[idx]);
}
```

- [ ] **Step 4: Reset `nextFlowId` in `resetStore`**

In `test/mock-server.ts`, change `resetStore`:

```ts
export function resetStore() {
  store = structuredClone(SEED_DATA);
  nextFlowId = 1000;
}
```

- [ ] **Step 5: Run the existing test suite to make sure nothing broke**

Run: `bun test`
Expected: all existing tests still pass (no new ones yet).

- [ ] **Step 6: Commit**

```bash
git add test/mock-server.ts
git commit -m "test: add flows routes to mock server"
```

---

## Task 2: `diff.ts` — types, constants, `normalize()`

Pure module with no I/O. Define the field-handling constants and the normalize function used by both diff comparison and PUT body construction.

**Files:**
- Create: `src/commands/flows/diff.ts`
- Test: `test/flows-diff.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/flows-diff.test.ts`:

```ts
import { test, expect, describe } from "bun:test";
import { normalize, STRIP_FOR_DIFF, PRESERVE_FROM_REMOTE } from "../src/commands/flows/diff.ts";

describe("normalize", () => {
  test("removes volatile fields", () => {
    const result = normalize({
      flowId: "f1",
      name: "x",
      mtime: 123,
      btime: 456,
      flow: { components: {} },
    });
    expect(result).toEqual({
      flowId: "f1",
      name: "x",
      flow: { components: {} },
    });
  });

  test("removes preserved-from-remote fields", () => {
    const result = normalize({
      flowId: "f1",
      name: "x",
      userId: "owner",
      sharedWith: [{ user: "a" }],
    });
    expect(result).toEqual({ flowId: "f1", name: "x" });
  });

  test("removes stage", () => {
    const result = normalize({ flowId: "f1", stage: "running" });
    expect(result).toEqual({ flowId: "f1" });
  });

  test("does not mutate the input", () => {
    const input = { flowId: "f1", mtime: 1, userId: "u" };
    normalize(input);
    expect(input).toEqual({ flowId: "f1", mtime: 1, userId: "u" });
  });

  test("STRIP_FOR_DIFF is the union of strip lists", () => {
    expect(STRIP_FOR_DIFF).toContain("mtime");
    expect(STRIP_FOR_DIFF).toContain("btime");
    expect(STRIP_FOR_DIFF).toContain("stage");
    expect(STRIP_FOR_DIFF).toContain("userId");
    expect(STRIP_FOR_DIFF).toContain("sharedWith");
  });

  test("PRESERVE_FROM_REMOTE lists owner and sharing", () => {
    expect(PRESERVE_FROM_REMOTE).toEqual(["userId", "sharedWith"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test test/flows-diff.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the diff module**

Create `src/commands/flows/diff.ts`:

```ts
export type Flow = Record<string, unknown> & { flowId?: string };

export const PRESERVE_FROM_REMOTE = ["userId", "sharedWith"] as const;

const VOLATILE = ["mtime", "btime"] as const;
const NOT_RECONCILED = ["stage"] as const;

export const STRIP_FOR_DIFF: string[] = [
  ...VOLATILE,
  ...NOT_RECONCILED,
  ...PRESERVE_FROM_REMOTE,
];

export function normalize(flow: Flow): Flow {
  const out: Flow = {};
  for (const [key, value] of Object.entries(flow)) {
    if (STRIP_FOR_DIFF.includes(key)) continue;
    out[key] = value;
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test test/flows-diff.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/commands/flows/diff.ts test/flows-diff.test.ts
git commit -m "feat: add flows diff normalize and field constants"
```

---

## Task 3: `diff.ts` — `computePlan()`

Pure plan computation. Decides what to create, update, skip, or prune given a set of local files and the current remote state.

**Files:**
- Modify: `src/commands/flows/diff.ts`
- Modify: `test/flows-diff.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `test/flows-diff.test.ts`:

```ts
import { computePlan } from "../src/commands/flows/diff.ts";

describe("computePlan", () => {
  test("local file with no flowId becomes a create", () => {
    const plan = computePlan(
      [{ path: "/a.json", content: { name: "new" } }],
      [],
      { prune: false }
    );
    expect(plan.creates).toEqual([{ path: "/a.json", content: { name: "new" } }]);
    expect(plan.updates).toEqual([]);
    expect(plan.skips).toEqual([]);
    expect(plan.prunes).toEqual([]);
  });

  test("matching content with same flowId becomes a skip", () => {
    const flow = { flowId: "f1", name: "same", flow: { components: {} } };
    const plan = computePlan(
      [{ path: "/a.json", content: flow }],
      [{ ...flow, mtime: 999, userId: "owner" }],
      { prune: false }
    );
    expect(plan.skips).toEqual([{ path: "/a.json", flowId: "f1" }]);
    expect(plan.updates).toEqual([]);
    expect(plan.creates).toEqual([]);
  });

  test("differing content with same flowId becomes an update", () => {
    const local = { flowId: "f1", name: "local", flow: { components: {} } };
    const remote = { flowId: "f1", name: "remote", flow: { components: {} }, userId: "owner" };
    const plan = computePlan(
      [{ path: "/a.json", content: local }],
      [remote],
      { prune: false }
    );
    expect(plan.updates).toEqual([{ path: "/a.json", content: local, remote }]);
    expect(plan.skips).toEqual([]);
  });

  test("local flowId not present remotely becomes a stale-id create", () => {
    const local = { flowId: "f-stale", name: "ghost" };
    const plan = computePlan(
      [{ path: "/a.json", content: local }],
      [{ flowId: "f-other", name: "other" }],
      { prune: false }
    );
    expect(plan.creates).toEqual([
      { path: "/a.json", content: local, staleId: "f-stale" },
    ]);
  });

  test("remote-only flow is ignored when prune is false", () => {
    const plan = computePlan(
      [],
      [{ flowId: "f1", name: "orphan" }],
      { prune: false }
    );
    expect(plan.prunes).toEqual([]);
  });

  test("remote-only flow becomes a prune when prune is true", () => {
    const plan = computePlan(
      [],
      [{ flowId: "f1", name: "orphan" }],
      { prune: true }
    );
    expect(plan.prunes).toEqual([{ flowId: "f1", name: "orphan" }]);
  });

  test("mixed: create, update, skip, prune in one plan", () => {
    const updateLocal = { flowId: "f-up", name: "new-name" };
    const updateRemote = { flowId: "f-up", name: "old-name", userId: "owner" };
    const skipFlow = { flowId: "f-skip", name: "same" };
    const newLocal = { name: "fresh" };

    const plan = computePlan(
      [
        { path: "/up.json", content: updateLocal },
        { path: "/skip.json", content: skipFlow },
        { path: "/new.json", content: newLocal },
      ],
      [updateRemote, skipFlow, { flowId: "f-orphan", name: "orphan" }],
      { prune: true }
    );

    expect(plan.creates).toEqual([{ path: "/new.json", content: newLocal }]);
    expect(plan.updates).toEqual([
      { path: "/up.json", content: updateLocal, remote: updateRemote },
    ]);
    expect(plan.skips).toEqual([{ path: "/skip.json", flowId: "f-skip" }]);
    expect(plan.prunes).toEqual([{ flowId: "f-orphan", name: "orphan" }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test test/flows-diff.test.ts`
Expected: FAIL — `computePlan` not exported.

- [ ] **Step 3: Implement `computePlan` in `src/commands/flows/diff.ts`**

Append to `src/commands/flows/diff.ts`:

```ts
export interface LocalFile {
  path: string;
  content: Flow;
}

export interface CreateEntry {
  path: string;
  content: Flow;
  staleId?: string;
}

export interface UpdateEntry {
  path: string;
  content: Flow;
  remote: Flow;
}

export interface SkipEntry {
  path: string;
  flowId: string;
}

export interface PruneEntry {
  flowId: string;
  name: string;
}

export interface Plan {
  creates: CreateEntry[];
  updates: UpdateEntry[];
  skips: SkipEntry[];
  prunes: PruneEntry[];
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function computePlan(
  localFiles: LocalFile[],
  remoteFlows: Flow[],
  options: { prune: boolean }
): Plan {
  const plan: Plan = { creates: [], updates: [], skips: [], prunes: [] };
  const remoteById = new Map<string, Flow>();
  for (const flow of remoteFlows) {
    if (typeof flow.flowId === "string") {
      remoteById.set(flow.flowId, flow);
    }
  }
  const referencedRemoteIds = new Set<string>();

  for (const file of localFiles) {
    const localId = file.content.flowId;
    if (typeof localId !== "string") {
      plan.creates.push({ path: file.path, content: file.content });
      continue;
    }

    const remote = remoteById.get(localId);
    if (!remote) {
      plan.creates.push({
        path: file.path,
        content: file.content,
        staleId: localId,
      });
      continue;
    }

    referencedRemoteIds.add(localId);
    if (deepEqual(normalize(file.content), normalize(remote))) {
      plan.skips.push({ path: file.path, flowId: localId });
    } else {
      plan.updates.push({ path: file.path, content: file.content, remote });
    }
  }

  if (options.prune) {
    for (const flow of remoteFlows) {
      const id = flow.flowId;
      if (typeof id !== "string") continue;
      if (referencedRemoteIds.has(id)) continue;
      plan.prunes.push({ flowId: id, name: String(flow.name ?? "") });
    }
  }

  return plan;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test test/flows-diff.test.ts`
Expected: PASS, 13 tests total.

- [ ] **Step 5: Commit**

```bash
git add src/commands/flows/diff.ts test/flows-diff.test.ts
git commit -m "feat: add computePlan for flow desired-state diffing"
```

---

## Task 4: Flows command group skeleton + `flows import`

Wire up an empty `flows` command group, then implement the simpler of the two commands first.

**Files:**
- Create: `src/commands/flows/index.ts`
- Create: `src/commands/flows/import.ts`
- Create: `src/commands/flows/apply.ts` (placeholder)
- Modify: `src/index.ts`

- [ ] **Step 1: Create the placeholder apply command**

Create `src/commands/flows/apply.ts`:

```ts
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
```

- [ ] **Step 2: Create the import command**

Create `src/commands/flows/import.ts`:

```ts
import type { Command } from "@commander-js/extra-typings";
import ora from "ora";
import { client } from "../../client.ts";

export function registerImport(flows: Command) {
  flows
    .command("import")
    .description("Fetch a flow from the server and write it to a JSON file")
    .argument("<flowId>", "ID of the flow to fetch")
    .requiredOption("--output <file>", "Path to write the flow JSON to")
    .action(async (flowId, opts) => {
      const spinner = ora(`Fetching flow ${flowId}`).start();
      try {
        const flow = await client.get(`/flows/${encodeURIComponent(flowId)}`);
        await Bun.write(opts.output, JSON.stringify(flow, null, 2) + "\n");
        spinner.succeed(`Wrote ${opts.output}`);
      } catch (err) {
        spinner.fail(`Failed to import ${flowId}: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
```

- [ ] **Step 3: Create the group registration**

Create `src/commands/flows/index.ts`:

```ts
import type { Command } from "@commander-js/extra-typings";
import { registerApply } from "./apply.ts";
import { registerImport } from "./import.ts";

export function registerFlows(program: Command) {
  const flows = program
    .command("flows")
    .description("Manage Appmixer flows as desired-state JSON files");
  registerApply(flows);
  registerImport(flows);
}
```

- [ ] **Step 4: Wire it into the root command**

In `src/index.ts`, add the import alongside the others (after the `registerProvision` import):

```ts
import { registerFlows } from "./commands/flows/index.ts";
```

And add the call after `registerProvision(program);`:

```ts
registerFlows(program);
```

- [ ] **Step 5: Smoke test the CLI surface**

Run: `bun src/index.ts flows --help`
Expected output contains: `apply` and `import` subcommands.

Run: `bun src/index.ts flows import --help`
Expected: shows `<flowId>` argument and `--output` required option.

- [ ] **Step 6: Commit**

```bash
git add src/commands/flows/ src/index.ts
git commit -m "feat: scaffold flows command group with import"
```

---

## Task 5: E2E test for `flows import`

Verify import end-to-end against the mock server before moving on.

**Files:**
- Create: `test/e2e/flows.test.ts`

- [ ] **Step 1: Write the test**

Create `test/e2e/flows.test.ts`:

```ts
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
});
```

- [ ] **Step 2: Run the test**

Run: `bun test test/e2e/flows.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 3: Commit**

```bash
git add test/e2e/flows.test.ts
git commit -m "test: add e2e coverage for flows import"
```

---

## Task 6: `flows apply` — local file loader with duplicate and JSON-error guards

Pure-ish helper that walks the directory, parses JSON, and rejects corrupt input. Lives inside `apply.ts` but is exported for unit testing.

**Files:**
- Modify: `src/commands/flows/apply.ts`
- Create: `test/flows-apply.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/flows-apply.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test test/flows-apply.test.ts`
Expected: FAIL — `loadLocalFlows` not exported.

- [ ] **Step 3: Implement the loader**

Replace `src/commands/flows/apply.ts` with:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test test/flows-apply.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/commands/flows/apply.ts test/flows-apply.test.ts
git commit -m "feat: add loadLocalFlows with duplicate and JSON guards"
```

---

## Task 7: `flows apply` — plan printing

Pull the plan together, render it, and exit early on empty plan. Still no execution yet — that comes next.

**Files:**
- Modify: `src/commands/flows/apply.ts`

- [ ] **Step 1: Add a plan printer at the top of `apply.ts`**

In `src/commands/flows/apply.ts`, add these imports near the top (alongside the existing ones):

```ts
import chalk from "chalk";
import { client } from "../../client.ts";
import { computePlan, type Flow, type Plan } from "./diff.ts";
```

Then add this function (above `registerApply`):

```ts
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
```

- [ ] **Step 2: Replace the placeholder action body**

Replace the `.action(async () => { ... })` block in `registerApply` with:

```ts
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
```

- [ ] **Step 3: Smoke test the plan output against the mock server**

Run an ad-hoc end-to-end check by adding this temporary e2e test, then deleting it after the run. Append to `test/e2e/flows.test.ts`:

```ts
  test("flows apply prints a plan and exits 'No changes' when synced", async () => {
    const dir = await mkdtemp(join(tmpdir(), "flows-plan-"));
    const result = await runCli("flows", "apply", dir, "--yes");
    // Empty local + no --prune means everything is a no-op
    expect(result.stderr).toContain("No changes.");
    expect(result.exitCode).toBe(0);
  });
```

Run: `bun test test/e2e/flows.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 4: Commit**

```bash
git add src/commands/flows/apply.ts test/e2e/flows.test.ts
git commit -m "feat: print flows apply plan and short-circuit when empty"
```

---

## Task 8: `flows apply` — confirmation prompt with non-TTY guard

Adds the `y/N` prompt and rejects non-interactive runs that didn't pass `--yes`.

**Files:**
- Modify: `src/commands/flows/apply.ts`

- [ ] **Step 1: Add a `confirm` helper above `registerApply`**

In `src/commands/flows/apply.ts`, add this import near the top:

```ts
import { createInterface } from "node:readline";
```

Then add this function above `registerApply`:

```ts
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
```

- [ ] **Step 2: Insert the prompt before execution**

Replace the section in the `.action` block that currently reads:

```ts
        if (isPlanEmpty(plan)) {
          console.error("No changes.");
          return;
        }

        // Execution lands in the next task
        console.error("(execution not yet implemented)");
        process.exit(1);
```

with:

```ts
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

        // Execution lands in the next task
        console.error("(execution not yet implemented)");
        process.exit(1);
```

- [ ] **Step 3: Add a non-TTY guard test**

Append to `test/e2e/flows.test.ts`:

```ts
  test("flows apply refuses to run without --yes in a non-tty", async () => {
    const dir = await mkdtemp(join(tmpdir(), "flows-tty-"));
    // Author a brand-new flow so the plan is non-empty
    await Bun.write(join(dir, "new.json"), JSON.stringify({ name: "fresh" }));

    const result = await runCli("flows", "apply", dir);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("non-interactive shell");
  });
```

- [ ] **Step 4: Run tests**

Run: `bun test test/e2e/flows.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/commands/flows/apply.ts test/e2e/flows.test.ts
git commit -m "feat: prompt for confirmation in flows apply"
```

---

## Task 9: `flows apply` — execute creates with writeback

First execution path. POST new flows, write the assigned `flowId` back into the local file, fail hard if writeback fails.

**Files:**
- Modify: `src/commands/flows/apply.ts`

- [ ] **Step 1: Add an execute helper**

In `src/commands/flows/apply.ts`, add this function above `registerApply`:

```ts
import ora from "ora";
import { PRESERVE_FROM_REMOTE } from "./diff.ts";

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
```

(Move the `import ora from "ora";` to join the other imports at the top of the file if it isn't there already; the `PRESERVE_FROM_REMOTE` import will be used in the next task.)

- [ ] **Step 2: Wire it into the action**

Replace the `// Execution lands in the next task` block at the bottom of `.action` with:

```ts
        const create = await executeCreates(plan);
        const total = create.successes + create.failures;
        console.error(`\nDone: ${create.successes}/${total} succeeded`);
        if (create.failures > 0) process.exit(1);
```

- [ ] **Step 3: Add an e2e test for create + writeback**

Append to `test/e2e/flows.test.ts`:

```ts
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
```

- [ ] **Step 4: Run tests**

Run: `bun test test/e2e/flows.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/commands/flows/apply.ts test/e2e/flows.test.ts
git commit -m "feat: execute create operations in flows apply"
```

---

## Task 10: `flows apply` — execute updates with merge and `--force`

Update the matching flow, copy `userId` and `sharedWith` from the remote response onto the body before sending, gate running flows behind `--force`.

**Files:**
- Modify: `src/commands/flows/apply.ts`

- [ ] **Step 1: Add `executeUpdates`**

In `src/commands/flows/apply.ts`, add above `registerApply` (next to `executeCreates`):

```ts
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
```

- [ ] **Step 2: Call it from the action**

Replace the create-only execution block in `.action` with:

```ts
        const create = await executeCreates(plan);
        const update = await executeUpdates(plan, { force: opts.force });

        const successes = create.successes + update.successes;
        const failures = create.failures + update.failures;
        const total = successes + failures;
        console.error(`\nDone: ${successes}/${total} succeeded`);
        if (failures > 0) process.exit(1);
```

- [ ] **Step 3: Add update tests**

Append to `test/e2e/flows.test.ts`:

```ts
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
```

(Note: the closing `});` is for the `describe` block — only one closing brace should exist; remove the prior closing if you appended inside it. Verify the file still parses.)

- [ ] **Step 4: Run tests**

Run: `bun test test/e2e/flows.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/commands/flows/apply.ts test/e2e/flows.test.ts
git commit -m "feat: execute update operations with merge and --force gate"
```

---

## Task 11: `flows apply` — execute prunes

Final execution branch. Delete remote flows that aren't represented locally, only when `--prune` was passed.

**Files:**
- Modify: `src/commands/flows/apply.ts`

- [ ] **Step 1: Add `executePrunes`**

In `src/commands/flows/apply.ts`, add next to the other execute functions:

```ts
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
```

- [ ] **Step 2: Wire it into the action**

Replace the executes block in `.action` with:

```ts
        const create = await executeCreates(plan);
        const update = await executeUpdates(plan, { force: opts.force });
        const prune = await executePrunes(plan);

        const successes = create.successes + update.successes + prune.successes;
        const failures = create.failures + update.failures + prune.failures;
        const total = successes + failures;
        console.error(`\nDone: ${successes}/${total} succeeded`);
        if (failures > 0) process.exit(1);
```

- [ ] **Step 3: Add a prune test**

Append to `test/e2e/flows.test.ts` (inside the `describe`):

```ts
  test("flows apply --prune deletes remote flows missing locally", async () => {
    const dir = await mkdtemp(join(tmpdir(), "flows-prune-"));
    // Local folder has only seed1; seed2 should be pruned
    const file = join(dir, "seed1.json");
    await runCli("flows", "import", "flow-seed-1", "--output", file);

    const result = await runCli("flows", "apply", dir, "--yes", "--prune", "--force");
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("prune   flow-seed-2");
    expect(result.stderr).toContain("Pruned flow-seed-2");

    // Confirm: importing the pruned flow now fails
    const missing = await runCli(
      "flows",
      "import",
      "flow-seed-2",
      "--output",
      join(dir, "missing.json")
    );
    expect(missing.exitCode).toBe(1);
  });

  test("flows apply without --prune leaves remote-only flows alone", async () => {
    const dir = await mkdtemp(join(tmpdir(), "flows-noprune-"));
    const file = join(dir, "seed1.json");
    await runCli("flows", "import", "flow-seed-1", "--output", file);

    const result = await runCli("flows", "apply", dir, "--yes");
    // Plan should be a single skip → "No changes" path, exit 0
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("No changes.");
  });
```

- [ ] **Step 4: Run the full test suite**

Run: `bun test`
Expected: all tests pass — every prior suite plus the new flows tests.

- [ ] **Step 5: Commit**

```bash
git add src/commands/flows/apply.ts test/e2e/flows.test.ts
git commit -m "feat: execute prune operations behind --prune flag"
```

---

## Task 12: README docs and final verification

Document the new commands so users discover them.

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add a "Flows" section to the README**

In `README.md`, after the `provision import` section and before "Provisioning file format", insert:

```markdown
### `flows apply`

Reconcile a folder of flow JSON files against the server. Each `*.json` file in the folder describes one flow; the file's `flowId` field identifies it remotely. Files without a `flowId` are created on first apply and the assigned ID is written back to disk.

```bash
appmixer-adm flows apply <directory> [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `--prune` | Delete remote flows that have no local file | off |
| `--force` | Allow updating flows whose `stage` is `running` | off |
| `--yes` | Skip the confirmation prompt | off |

The command prints a plan (creates, updates, prunes, skips) and prompts for confirmation. In a non-interactive shell `--yes` is required. The fields `mtime`, `btime`, `stage`, `userId`, and `sharedWith` are ignored when diffing; `userId` and `sharedWith` are always taken from the server on update so ownership and sharing cannot be changed through `apply`.

### `flows import`

Fetch a single flow from the server and write it to a JSON file. Use this to refresh a local copy after editing through the Appmixer UI.

```bash
appmixer-adm flows import <flowId> --output <file>
```
```

- [ ] **Step 2: Run the full test suite one more time**

Run: `bun test`
Expected: all tests pass.

- [ ] **Step 3: Smoke test the help output**

Run: `bun src/index.ts flows apply --help`
Expected: shows `<directory>`, `--prune`, `--force`, `--yes`.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: document flows apply and flows import commands"
```

---

## Self-review notes

- **Spec coverage:** Every section of the spec maps to a task — commands (T4, T5, T7–11), file format (T2, T6), diff/field handling (T2, T3, T10), code structure (T2–T6), error/edge cases (T6, T7, T8, T9, T10), testing (T2, T3, T5, T6, T8, T9, T10, T11), README (T12).
- **No reconciliation of `stage`:** confirmed — `STRIP_FOR_DIFF` includes `stage` and no execute path touches the coordinator endpoint.
- **Type names are consistent:** `Plan`, `LocalFile`, `CreateEntry`, `UpdateEntry`, `SkipEntry`, `PruneEntry`, `ExecuteResult` are all defined once and referenced by the same name throughout.
- **Function names are consistent:** `loadLocalFlows`, `computePlan`, `normalize`, `formatPlan`, `confirm`, `executeCreates`, `executeUpdates`, `executePrunes` — all referenced exactly as defined.
- **Writeback failure path:** Task 9 names it as a hard failure with a clear remediation message, matching the spec's "user must be told immediately" requirement.
- **Non-TTY guard:** Task 8 implements and tests it.
- **Empty plan exits 0:** Task 7 implements; Task 11's "without --prune" test exercises it.
