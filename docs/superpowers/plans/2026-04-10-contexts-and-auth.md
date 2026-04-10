# Contexts and Auth Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current misuse of `Bun.secrets` with a proper context system (named environments with baseUrl, username, and token), add interactive password prompting via `@inquirer/prompts`, and introduce a `context` command group for managing contexts.

**Architecture:** A single `config.ts` module owns all `Bun.secrets` access and serializes the full config (`activeContext` + `contexts`) as JSON under one secret. `auth.ts` shrinks to a thin orchestrator. A new `prompts.ts` wraps `@inquirer/prompts` with a test-mode env-var shortcut. Context commands live in `src/commands/context/`. Test mode is file-backed via `APPMIXER_TEST_CONFIG` env var so chained CLI invocations in e2e tests share state without touching the real keychain.

**Tech Stack:** Bun, TypeScript, `@inquirer/prompts` (new), `@commander-js/extra-typings`, `ora`, `chalk`. Tests use `bun:test`.

**Spec:** `docs/superpowers/specs/2026-04-10-contexts-and-auth-design.md`

---

## File Structure

**Created:**
- `src/config.ts` — `Config`/`Context` types, `loadConfig`, `saveConfig`, `resolveContext`, `resetTestConfig`
- `src/prompts.ts` — `promptPassword`
- `src/commands/context/index.ts` — `registerContext`
- `src/commands/context/set.ts` — `context set`
- `src/commands/context/use.ts` — `context use`
- `src/commands/context/list.ts` — `context list`
- `src/commands/context/current.ts` — `context current`
- `src/commands/context/delete.ts` — `context delete`
- `test/config.test.ts` — unit tests for `config.ts`
- `test/prompts.test.ts` — unit tests for `prompts.ts`
- `test/e2e/context.test.ts` — end-to-end context command coverage

**Modified:**
- `src/auth.ts` — rewritten around `config.ts`; `decodeJwt` preserved
- `src/index.ts` — login command uses new `login(opts)` signature + prompt fallback; registers `context` group
- `test/auth.test.ts` — extended with tests for new login behavior
- `test/e2e/helpers.ts` — `runCli` and `runLoginCli` set `APPMIXER_TEST_CONFIG` so file-backed test mode works
- `test/e2e/login.test.ts` — updated error messages and added prompt-via-env-var test
- `README.md` — document `context` commands and the new login flow
- `package.json` — `@inquirer/prompts` dependency

---

## Test Mode Strategy (read this before starting)

Two test-mode paths coexist:

1. **Legacy path for downstream commands** — `runCli` sets `CLI_TEST_MODE=true`, `APPMIXER_TOKEN`, `APPMIXER_BASE_URL`. `getSession()` checks for those three and returns them directly, bypassing `config.ts` entirely. This keeps every existing `flows`/`provision`/`acl`/`config`/`service-config` test passing unchanged.

2. **Config-file path for login and context commands** — `runCli` and `runLoginCli` ALSO set `APPMIXER_TEST_CONFIG=<tempfile>`. When this env var is set, `loadConfig`/`saveConfig` read/write that JSON file instead of calling `Bun.secrets`. Chained CLI invocations within a single test share state via that file. Real production usage has the env var unset, so `Bun.secrets` is used.

A unit-test-only in-memory fallback is ALSO supported: when `CLI_TEST_MODE=true` but `APPMIXER_TEST_CONFIG` is unset, `config.ts` uses a module-level object. `resetTestConfig()` clears it. This is for `test/config.test.ts` unit tests that don't spawn subprocesses.

Decision table for `loadConfig`/`saveConfig`:

| `APPMIXER_TEST_CONFIG` set? | `CLI_TEST_MODE=true`? | Behavior                       |
|-----------------------------|----------------------|--------------------------------|
| yes                         | any                  | Read/write JSON file at path   |
| no                          | yes                  | Read/write module-level object |
| no                          | no                   | Call `Bun.secrets`             |

---

## Task 1: Add `@inquirer/prompts` and create `src/config.ts` skeleton

Install the dependency, create the config module with types, `loadConfig`, `saveConfig`, and the three-branch test-mode storage logic. Unit-test round-trip via the in-memory branch.

**Files:**
- Modify: `package.json`
- Create: `src/config.ts`
- Create: `test/config.test.ts`

- [ ] **Step 1: Install `@inquirer/prompts`**

Run: `cd /home/vgmello/repos/poc/appmixer-cli && bun add @inquirer/prompts`
Expected: `package.json` gains `@inquirer/prompts` under `dependencies`, `bun.lock` updates, no errors.

- [ ] **Step 2: Write the failing test**

Create `test/config.test.ts`:

```ts
import { test, expect, describe, beforeEach } from "bun:test";
import { loadConfig, saveConfig, resetTestConfig } from "../src/config.ts";

describe("loadConfig / saveConfig (in-memory test mode)", () => {
  beforeEach(() => {
    process.env.CLI_TEST_MODE = "true";
    delete process.env.APPMIXER_TEST_CONFIG;
    resetTestConfig();
  });

  test("loadConfig on a fresh install returns an empty default", async () => {
    const config = await loadConfig();
    expect(config).toEqual({ activeContext: null, contexts: {} });
  });

  test("saveConfig then loadConfig round-trips", async () => {
    const original = {
      activeContext: "prod",
      contexts: {
        prod: {
          baseUrl: "https://api.example.com",
          username: "admin",
          token: "tok-123",
          tokenExp: 9999999999,
        },
      },
    };
    await saveConfig(original);
    const loaded = await loadConfig();
    expect(loaded).toEqual(original);
  });

  test("resetTestConfig clears in-memory state", async () => {
    await saveConfig({
      activeContext: "foo",
      contexts: { foo: { baseUrl: "u", username: "n" } },
    });
    resetTestConfig();
    expect(await loadConfig()).toEqual({ activeContext: null, contexts: {} });
  });
});

describe("loadConfig / saveConfig (file-backed test mode)", () => {
  beforeEach(async () => {
    const { mkdtemp } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");
    const dir = await mkdtemp(join(tmpdir(), "cfg-"));
    process.env.CLI_TEST_MODE = "true";
    process.env.APPMIXER_TEST_CONFIG = join(dir, "config.json");
  });

  test("loadConfig when the file does not exist returns the empty default", async () => {
    const config = await loadConfig();
    expect(config).toEqual({ activeContext: null, contexts: {} });
  });

  test("saveConfig writes JSON and loadConfig reads it back", async () => {
    await saveConfig({
      activeContext: "staging",
      contexts: { staging: { baseUrl: "https://s.example.com", username: "u" } },
    });
    const loaded = await loadConfig();
    expect(loaded.activeContext).toBe("staging");
    expect(loaded.contexts.staging?.baseUrl).toBe("https://s.example.com");

    // Verify it's actually on disk
    const raw = await Bun.file(process.env.APPMIXER_TEST_CONFIG!).text();
    expect(JSON.parse(raw).activeContext).toBe("staging");
  });

  test("loadConfig throws a clear error on corrupt JSON", async () => {
    await Bun.write(process.env.APPMIXER_TEST_CONFIG!, "{not json");
    await expect(loadConfig()).rejects.toThrow(/corrupt/i);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `bun test test/config.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Create `src/config.ts`**

```ts
import { secrets } from "bun";

const SERVICE = "appmixer-adm";
const SECRET_NAME = "config";

export interface Context {
  baseUrl: string;
  username: string;
  token?: string;
  tokenExp?: number;
}

export interface Config {
  activeContext: string | null;
  contexts: Record<string, Context>;
}

const EMPTY: Config = { activeContext: null, contexts: {} };

let inMemoryConfig: Config = structuredClone(EMPTY);

export function resetTestConfig(): void {
  inMemoryConfig = structuredClone(EMPTY);
}

function storageMode(): "file" | "memory" | "keychain" {
  if (process.env.APPMIXER_TEST_CONFIG) return "file";
  if (process.env.CLI_TEST_MODE === "true") return "memory";
  return "keychain";
}

export async function loadConfig(): Promise<Config> {
  const mode = storageMode();

  if (mode === "memory") {
    return structuredClone(inMemoryConfig);
  }

  let raw: string | null;
  if (mode === "file") {
    const path = process.env.APPMIXER_TEST_CONFIG!;
    const file = Bun.file(path);
    if (!(await file.exists())) return structuredClone(EMPTY);
    raw = await file.text();
  } else {
    raw = await secrets.get({ service: SERVICE, name: SECRET_NAME });
  }

  if (!raw) return structuredClone(EMPTY);

  try {
    return JSON.parse(raw) as Config;
  } catch (err) {
    throw new Error(
      `Config is corrupt. Run 'login' to reset it. (${(err as Error).message})`
    );
  }
}

export async function saveConfig(config: Config): Promise<void> {
  const mode = storageMode();
  const raw = JSON.stringify(config);

  if (mode === "memory") {
    inMemoryConfig = structuredClone(config);
    return;
  }

  if (mode === "file") {
    await Bun.write(process.env.APPMIXER_TEST_CONFIG!, raw);
    return;
  }

  await secrets.set({ service: SERVICE, name: SECRET_NAME }, raw);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `bun test test/config.test.ts`
Expected: PASS, 6 tests.

Run: `bun test`
Expected: the full suite still passes (other tests unaffected).

- [ ] **Step 6: Commit**

```bash
git add package.json bun.lock src/config.ts test/config.test.ts
git commit -m "feat: add config module with file/memory/keychain storage"
```

---

## Task 2: Add `resolveContext` to `src/config.ts`

Pure-ish helper that applies the override hierarchy (`opts.context` → `APPMIXER_CONTEXT` env var → `activeContext`). Throws with actionable messages.

**Files:**
- Modify: `src/config.ts`
- Modify: `test/config.test.ts`

- [ ] **Step 1: Append failing tests to `test/config.test.ts`**

```ts
import { resolveContext } from "../src/config.ts";

describe("resolveContext", () => {
  beforeEach(() => {
    process.env.CLI_TEST_MODE = "true";
    delete process.env.APPMIXER_TEST_CONFIG;
    delete process.env.APPMIXER_CONTEXT;
    resetTestConfig();
  });

  test("returns the context named by opts.context", async () => {
    await saveConfig({
      activeContext: "staging",
      contexts: {
        prod: { baseUrl: "p", username: "u" },
        staging: { baseUrl: "s", username: "u" },
      },
    });
    const { name, ctx } = await resolveContext({ context: "prod" });
    expect(name).toBe("prod");
    expect(ctx.baseUrl).toBe("p");
  });

  test("opts.context takes precedence over APPMIXER_CONTEXT env var", async () => {
    await saveConfig({
      activeContext: null,
      contexts: {
        a: { baseUrl: "a", username: "u" },
        b: { baseUrl: "b", username: "u" },
      },
    });
    process.env.APPMIXER_CONTEXT = "a";
    const { name } = await resolveContext({ context: "b" });
    expect(name).toBe("b");
  });

  test("APPMIXER_CONTEXT wins when opts.context is absent", async () => {
    await saveConfig({
      activeContext: "a",
      contexts: {
        a: { baseUrl: "a", username: "u" },
        b: { baseUrl: "b", username: "u" },
      },
    });
    process.env.APPMIXER_CONTEXT = "b";
    const { name } = await resolveContext();
    expect(name).toBe("b");
  });

  test("falls back to activeContext when nothing else is set", async () => {
    await saveConfig({
      activeContext: "a",
      contexts: { a: { baseUrl: "a", username: "u" } },
    });
    const { name } = await resolveContext();
    expect(name).toBe("a");
  });

  test("throws when nothing resolves", async () => {
    await expect(resolveContext()).rejects.toThrow(/no active context/i);
  });

  test("throws when the requested context is missing", async () => {
    await saveConfig({
      activeContext: null,
      contexts: { a: { baseUrl: "a", username: "u" } },
    });
    await expect(resolveContext({ context: "nope" })).rejects.toThrow(
      /context 'nope' does not exist/i
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test test/config.test.ts`
Expected: FAIL — `resolveContext` not exported.

- [ ] **Step 3: Append `resolveContext` to `src/config.ts`**

```ts
export async function resolveContext(
  opts?: { context?: string }
): Promise<{ name: string; ctx: Context }> {
  const config = await loadConfig();
  const requested = opts?.context ?? process.env.APPMIXER_CONTEXT ?? config.activeContext;

  if (!requested) {
    throw new Error(
      "No active context. Run 'appmixer-adm login --context <name> --base-url <url> --username <user>' to create one."
    );
  }

  const ctx = config.contexts[requested];
  if (!ctx) {
    const known = Object.keys(config.contexts);
    const suffix = known.length ? ` Known contexts: ${known.join(", ")}.` : "";
    throw new Error(`Context '${requested}' does not exist.${suffix}`);
  }

  return { name: requested, ctx };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test test/config.test.ts`
Expected: PASS, 12 tests.

- [ ] **Step 5: Commit**

```bash
git add src/config.ts test/config.test.ts
git commit -m "feat: add resolveContext with flag/env/active precedence"
```

---

## Task 3: Create `src/prompts.ts` with test-mode bypass

Wraps `@inquirer/prompts` so tests can inject a password via `APPMIXER_TEST_PASSWORD` env var without touching real stdin.

**Files:**
- Create: `src/prompts.ts`
- Create: `test/prompts.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/prompts.test.ts`:

```ts
import { test, expect, describe, beforeEach } from "bun:test";
import { promptPassword } from "../src/prompts.ts";

describe("promptPassword", () => {
  beforeEach(() => {
    process.env.CLI_TEST_MODE = "true";
    delete process.env.APPMIXER_TEST_PASSWORD;
  });

  test("returns APPMIXER_TEST_PASSWORD when set in test mode", async () => {
    process.env.APPMIXER_TEST_PASSWORD = "hunter2";
    const result = await promptPassword("Password:");
    expect(result).toBe("hunter2");
  });

  test("throws in test mode when APPMIXER_TEST_PASSWORD is missing", async () => {
    await expect(promptPassword("Password:")).rejects.toThrow(
      /APPMIXER_TEST_PASSWORD/
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test test/prompts.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/prompts.ts`**

```ts
import { password } from "@inquirer/prompts";

export async function promptPassword(message: string): Promise<string> {
  if (process.env.CLI_TEST_MODE === "true") {
    const value = process.env.APPMIXER_TEST_PASSWORD;
    if (value === undefined) {
      throw new Error(
        "CLI_TEST_MODE is set but APPMIXER_TEST_PASSWORD is missing. Set it in the test helper."
      );
    }
    return value;
  }

  if (!process.stdin.isTTY) {
    throw new Error(
      "No password provided. Use --password, APPMIXER_PASSWORD, or run in an interactive shell."
    );
  }

  return password({ message, mask: true });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test test/prompts.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/prompts.ts test/prompts.test.ts
git commit -m "feat: add prompts module with test-mode bypass"
```

---

## Task 4: Rewrite `src/auth.ts` around `config.ts`

Replace all direct `Bun.secrets` calls with `config.ts` calls. New `login(opts)` signature orchestrates: resolve/create context, resolve password (flag → env → prompt), authenticate, write token back. `getSession()` preserves its legacy CLI_TEST_MODE env-var path so existing `runCli` tests work unchanged, but otherwise delegates to `resolveContext`.

**Files:**
- Modify: `src/auth.ts`
- Modify: `test/auth.test.ts`

- [ ] **Step 1: Extend `test/auth.test.ts` with new login tests**

Append to `test/auth.test.ts` (keep the existing describe blocks):

```ts
import { login } from "../src/auth.ts";
import { loadConfig, saveConfig, resetTestConfig } from "../src/config.ts";
import { startServer } from "./mock-server.ts";

describe("login (refactored)", () => {
  let serverInfo: { port: number; stop: () => void };
  let baseUrl: string;

  beforeAll(() => {
    serverInfo = startServer(0);
    baseUrl = `http://localhost:${serverInfo.port}`;
  });

  afterAll(() => {
    serverInfo.stop();
  });

  beforeEach(() => {
    process.env.CLI_TEST_MODE = "true";
    delete process.env.APPMIXER_TEST_CONFIG;
    delete process.env.APPMIXER_PASSWORD;
    delete process.env.APPMIXER_TEST_PASSWORD;
    resetTestConfig();
  });

  test("login creates a new context and writes token + tokenExp back", async () => {
    await login({
      context: "prod",
      baseUrl,
      username: "admin@test.com",
      password: "test123",
    });

    const config = await loadConfig();
    expect(config.activeContext).toBe("prod");
    expect(config.contexts.prod?.baseUrl).toBe(baseUrl);
    expect(config.contexts.prod?.username).toBe("admin@test.com");
    expect(typeof config.contexts.prod?.token).toBe("string");
    expect(typeof config.contexts.prod?.tokenExp).toBe("number");
  });

  test("login sets activeContext on first successful login only", async () => {
    await login({
      context: "prod",
      baseUrl,
      username: "admin@test.com",
      password: "test123",
    });
    await login({
      context: "staging",
      baseUrl,
      username: "admin@test.com",
      password: "test123",
    });

    const config = await loadConfig();
    expect(config.activeContext).toBe("prod");
    expect(Object.keys(config.contexts).sort()).toEqual(["prod", "staging"]);
  });

  test("login with an existing context reuses baseUrl/username and ignores flags", async () => {
    await saveConfig({
      activeContext: null,
      contexts: {
        prod: { baseUrl, username: "admin@test.com" },
      },
    });

    await login({
      context: "prod",
      baseUrl: "https://wrong.example.com",
      username: "wrong",
      password: "test123",
    });

    const config = await loadConfig();
    expect(config.contexts.prod?.baseUrl).toBe(baseUrl);
    expect(config.contexts.prod?.username).toBe("admin@test.com");
    expect(typeof config.contexts.prod?.token).toBe("string");
  });

  test("login with a new context but missing baseUrl throws", async () => {
    await expect(
      login({ context: "new", username: "u", password: "p" })
    ).rejects.toThrow(/does not exist.*base-url/i);
  });

  test("login with no context and nothing active throws", async () => {
    await expect(
      login({ username: "u", password: "p" })
    ).rejects.toThrow(/no active context/i);
  });

  test("login reads password from APPMIXER_TEST_PASSWORD when --password not given", async () => {
    process.env.APPMIXER_TEST_PASSWORD = "test123";
    await login({
      context: "prod",
      baseUrl,
      username: "admin@test.com",
    });
    const config = await loadConfig();
    expect(typeof config.contexts.prod?.token).toBe("string");
  });

  test("login with bad credentials throws and does not write a token", async () => {
    await expect(
      login({
        context: "prod",
        baseUrl,
        username: "wrong",
        password: "wrong",
      })
    ).rejects.toThrow(/login failed/i);
    const config = await loadConfig();
    expect(config.contexts.prod).toBeUndefined();
  });
});
```

Also add to the top of the file (if not already present):

```ts
import { beforeAll, afterAll, beforeEach } from "bun:test";
```

(The existing file imports `test, expect, describe` — just extend the import line to include the three lifecycle hooks.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test test/auth.test.ts`
Expected: FAIL — new `login` signature not matching, imports missing.

- [ ] **Step 3: Rewrite `src/auth.ts`**

Replace the entire contents of `src/auth.ts` with:

```ts
import chalk from "chalk";
import { loadConfig, saveConfig, resolveContext, type Context } from "./config.ts";
import { promptPassword } from "./prompts.ts";

interface JwtPayload {
  username: string;
  exp: number;
  [key: string]: unknown;
}

export function decodeJwt(token: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }
  const payload = JSON.parse(atob(parts[1]!));
  return payload as JwtPayload;
}

export interface LoginOptions {
  context?: string;
  baseUrl?: string;
  username?: string;
  password?: string;
}

async function resolveLoginContext(
  opts: LoginOptions
): Promise<{ name: string; baseUrl: string; username: string }> {
  const config = await loadConfig();

  const requested = opts.context ?? config.activeContext;
  if (!requested) {
    throw new Error(
      "No active context. Run 'appmixer-adm login --context <name> --base-url <url> --username <user>' to create one."
    );
  }

  const existing = config.contexts[requested];
  if (existing) {
    return { name: requested, baseUrl: existing.baseUrl, username: existing.username };
  }

  if (!opts.baseUrl || !opts.username) {
    throw new Error(
      `Context '${requested}' does not exist. Pass --base-url and --username to create it.`
    );
  }
  return { name: requested, baseUrl: opts.baseUrl, username: opts.username };
}

async function resolvePassword(opts: LoginOptions): Promise<string> {
  if (opts.password) return opts.password;
  const envPassword = process.env.APPMIXER_PASSWORD;
  if (envPassword) return envPassword;
  return promptPassword("Password:");
}

export async function login(opts: LoginOptions): Promise<void> {
  const { name, baseUrl, username } = await resolveLoginContext(opts);
  const password = await resolvePassword(opts);

  const response = await fetch(`${baseUrl}/user/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Login failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  const token = data.token as string;
  const payload = decodeJwt(token);

  const config = await loadConfig();
  config.contexts[name] = {
    baseUrl,
    username,
    token,
    tokenExp: payload.exp,
  };
  if (!config.activeContext) {
    config.activeContext = name;
  }
  await saveConfig(config);

  console.error(chalk.green(`Logged in as ${username} (${baseUrl}) [context: ${name}]`));
}

export async function getSession(): Promise<{
  token: string;
  baseUrl: string;
  username: string;
}> {
  // Legacy test-mode shortcut: preserves existing runCli test behavior.
  if (
    process.env.CLI_TEST_MODE === "true" &&
    process.env.APPMIXER_TOKEN &&
    process.env.APPMIXER_BASE_URL
  ) {
    const token = process.env.APPMIXER_TOKEN;
    const baseUrl = process.env.APPMIXER_BASE_URL;
    const payload = decodeJwt(token);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) {
      throw new Error("Session expired. Run `appmixer-adm login` first.");
    }
    return { token, baseUrl, username: payload.username };
  }

  const { ctx } = await resolveContext();
  if (!ctx.token || !ctx.tokenExp) {
    throw new Error("Session expired. Run `appmixer-adm login` first.");
  }
  const now = Math.floor(Date.now() / 1000);
  if (ctx.tokenExp <= now) {
    throw new Error("Session expired. Run `appmixer-adm login` first.");
  }
  return { token: ctx.token, baseUrl: ctx.baseUrl, username: ctx.username };
}
```

- [ ] **Step 4: Update existing `test/auth.test.ts` legacy tests**

The existing `describe("getSession in test mode", ...)` block stays unchanged — it tests the legacy shortcut which is preserved.

Verify no test references `secrets.set` or the old `login(baseUrl, username, password)` positional signature. Search the file for any such references and update callers to the new `login({...})` shape.

- [ ] **Step 5: Run tests**

Run: `bun test test/auth.test.ts`
Expected: PASS, all legacy tests plus 7 new login tests.

Run: `bun test`
Expected: full suite passes — existing `runCli`-based tests unaffected because they use the legacy env-var path in `getSession`.

- [ ] **Step 6: Commit**

```bash
git add src/auth.ts test/auth.test.ts
git commit -m "feat: rewrite auth around config module"
```

---

## Task 5: Update the `login` command in `src/index.ts`

Replace the old positional-arg validation with delegation to the new `login(opts)` signature. The command gains `--context` and stops requiring `--base-url`/`--username` when an existing context or active context is available.

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Replace the login command definition**

In `src/index.ts`, find the block starting `program.command("login")` and ending with `});`. Replace with:

```ts
program
  .command("login")
  .description("Authenticate with an Appmixer instance")
  .option("--context <name>", "Context name (defaults to the active context)")
  .option("--username <username>", "Username (required when creating a new context)")
  .option("--password <password>", "Password (overrides APPMIXER_PASSWORD; prompts if neither is set)")
  .option("--base-url <url>", "API base URL (required when creating a new context)")
  .action(async (opts) => {
    try {
      await login({
        context: opts.context,
        baseUrl: opts.baseUrl ?? process.env.APPMIXER_BASE_URL,
        username: opts.username ?? process.env.APPMIXER_USERNAME,
        password: opts.password ?? process.env.APPMIXER_PASSWORD,
      });
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
  });
```

(The `password` field is set from the flag or env var here because `login()` itself will still prompt if both are undefined — this lets the CLI layer stay thin.)

Actually, simpler: since `login()` itself checks `opts.password` then `APPMIXER_PASSWORD`, passing only `opts.password` here is enough:

```ts
      await login({
        context: opts.context,
        baseUrl: opts.baseUrl ?? process.env.APPMIXER_BASE_URL,
        username: opts.username ?? process.env.APPMIXER_USERNAME,
        password: opts.password,
      });
```

Use that shorter form.

- [ ] **Step 2: Smoke test the help output**

Run: `bun src/index.ts login --help`
Expected: shows `--context`, `--username`, `--password`, `--base-url` options.

- [ ] **Step 3: Run the full suite**

Run: `bun test`
Expected: the existing `test/e2e/login.test.ts` will have failures because the error messages changed — that's expected and fixed in Task 10. All other tests should pass.

Record which login e2e tests fail — they'll be updated in Task 10.

- [ ] **Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: wire login command to new LoginOptions signature"
```

---

## Task 6: Create the `context` command group

Six files under `src/commands/context/`. Each subcommand is thin — all heavy lifting lives in `config.ts`.

**Files:**
- Create: `src/commands/context/index.ts`
- Create: `src/commands/context/set.ts`
- Create: `src/commands/context/use.ts`
- Create: `src/commands/context/list.ts`
- Create: `src/commands/context/current.ts`
- Create: `src/commands/context/delete.ts`

- [ ] **Step 1: Create `src/commands/context/set.ts`**

```ts
import type { Command } from "@commander-js/extra-typings";
import chalk from "chalk";
import { loadConfig, saveConfig } from "../../config.ts";

export function registerSet(context: Command) {
  context
    .command("set")
    .description("Create or update a context")
    .argument("<name>", "Context name")
    .requiredOption("--base-url <url>", "API base URL")
    .requiredOption("--username <username>", "Username for this context")
    .action(async (name, opts) => {
      try {
        const config = await loadConfig();
        const existing = config.contexts[name];
        const changedUser = existing && existing.username !== opts.username;

        config.contexts[name] = {
          baseUrl: opts.baseUrl,
          username: opts.username,
          // Clear token if the username changed — the token belongs to the old user.
          ...(changedUser ? {} : existing && existing.token
            ? { token: existing.token, tokenExp: existing.tokenExp }
            : {}),
        };

        await saveConfig(config);

        if (existing) {
          console.error(chalk.green(`Updated context: ${name}`));
          if (changedUser) {
            console.error(
              chalk.yellow(
                `Warning: username changed — previous token cleared. Run 'login --context ${name}' to re-authenticate.`
              )
            );
          }
        } else {
          console.error(chalk.green(`Created context: ${name}`));
        }
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
```

- [ ] **Step 2: Create `src/commands/context/use.ts`**

```ts
import type { Command } from "@commander-js/extra-typings";
import chalk from "chalk";
import { loadConfig, saveConfig } from "../../config.ts";

export function registerUse(context: Command) {
  context
    .command("use")
    .description("Set the active context")
    .argument("<name>", "Context name")
    .action(async (name) => {
      try {
        const config = await loadConfig();
        if (!config.contexts[name]) {
          const known = Object.keys(config.contexts);
          const suffix = known.length ? ` Known contexts: ${known.join(", ")}.` : "";
          console.error(`Error: context '${name}' does not exist.${suffix}`);
          process.exit(1);
        }
        config.activeContext = name;
        await saveConfig(config);
        console.error(chalk.green(`Switched to context: ${name}`));
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
```

- [ ] **Step 3: Create `src/commands/context/list.ts`**

```ts
import type { Command } from "@commander-js/extra-typings";
import { loadConfig } from "../../config.ts";

function loginStatus(tokenExp?: number): string {
  if (tokenExp === undefined) return "no";
  const now = Math.floor(Date.now() / 1000);
  return tokenExp > now ? "yes" : "expired";
}

export function registerList(context: Command) {
  context
    .command("list")
    .description("List all contexts")
    .action(async () => {
      try {
        const config = await loadConfig();
        const names = Object.keys(config.contexts).sort();
        if (names.length === 0) {
          console.error("No contexts. Run 'login --context <name> --base-url <url> --username <user>' to create one.");
          return;
        }

        const rows = names.map((n) => {
          const ctx = config.contexts[n]!;
          return {
            marker: n === config.activeContext ? "*" : " ",
            name: n,
            baseUrl: ctx.baseUrl,
            username: ctx.username,
            status: loginStatus(ctx.tokenExp),
          };
        });

        const nameW = Math.max(4, ...rows.map((r) => r.name.length));
        const urlW = Math.max(8, ...rows.map((r) => r.baseUrl.length));
        const userW = Math.max(8, ...rows.map((r) => r.username.length));

        const header = `  ${"NAME".padEnd(nameW)}  ${"BASE URL".padEnd(urlW)}  ${"USERNAME".padEnd(userW)}  LOGGED IN`;
        console.log(header);
        for (const r of rows) {
          console.log(
            `${r.marker} ${r.name.padEnd(nameW)}  ${r.baseUrl.padEnd(urlW)}  ${r.username.padEnd(userW)}  ${r.status}`
          );
        }
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
```

- [ ] **Step 4: Create `src/commands/context/current.ts`**

```ts
import type { Command } from "@commander-js/extra-typings";
import { loadConfig } from "../../config.ts";

export function registerCurrent(context: Command) {
  context
    .command("current")
    .description("Print the active context name")
    .action(async () => {
      try {
        const config = await loadConfig();
        if (!config.activeContext) {
          console.error("Error: no active context. Run 'context use <name>' to set one.");
          process.exit(1);
        }
        console.log(config.activeContext);
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
```

- [ ] **Step 5: Create `src/commands/context/delete.ts`**

```ts
import type { Command } from "@commander-js/extra-typings";
import chalk from "chalk";
import { createInterface } from "node:readline";
import { loadConfig, saveConfig } from "../../config.ts";

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

export function registerDelete(context: Command) {
  context
    .command("delete")
    .description("Delete a context")
    .argument("<name>", "Context name")
    .option("--yes", "Skip confirmation", false)
    .action(async (name, opts) => {
      try {
        const config = await loadConfig();
        if (!config.contexts[name]) {
          console.error(`Error: context '${name}' does not exist.`);
          process.exit(1);
        }

        if (!opts.yes) {
          if (!process.stdin.isTTY) {
            console.error(
              "Error: refusing to delete context in a non-interactive shell without --yes."
            );
            process.exit(1);
          }
          const ok = await confirm(`Delete context '${name}'? [y/N]`);
          if (!ok) {
            console.error("Aborted.");
            return;
          }
        }

        const wasActive = config.activeContext === name;
        delete config.contexts[name];
        if (wasActive) {
          config.activeContext = null;
        }
        await saveConfig(config);

        console.error(chalk.green(`Deleted context: ${name}`));
        if (wasActive) {
          console.error(
            chalk.yellow("Deleted active context. Run 'context use <name>' to pick a new one.")
          );
        }
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
```

- [ ] **Step 6: Create `src/commands/context/index.ts`**

```ts
import type { Command } from "@commander-js/extra-typings";
import { registerSet } from "./set.ts";
import { registerUse } from "./use.ts";
import { registerList } from "./list.ts";
import { registerCurrent } from "./current.ts";
import { registerDelete } from "./delete.ts";

export function registerContext(program: Command) {
  const context = program
    .command("context")
    .description("Manage named environment contexts");
  registerSet(context);
  registerUse(context);
  registerList(context);
  registerCurrent(context);
  registerDelete(context);
}
```

- [ ] **Step 7: Commit**

```bash
git add src/commands/context/
git commit -m "feat: add context command group"
```

---

## Task 7: Register the `context` group in `src/index.ts`

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Add the import and register call**

In `src/index.ts`, add this import alongside the other `register*` imports:

```ts
import { registerContext } from "./commands/context/index.ts";
```

And add the call alongside the other registrations (order doesn't matter but keep it consistent — place after `registerFlows`):

```ts
registerContext(program);
```

- [ ] **Step 2: Smoke test**

Run: `bun src/index.ts context --help`
Expected: lists `set`, `use`, `list`, `current`, `delete`.

Run: `bun src/index.ts context set --help`
Expected: shows `<name>` arg and `--base-url`/`--username` required options.

- [ ] **Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: register context command group"
```

---

## Task 8: Update `test/e2e/helpers.ts` for file-backed test mode

Both `runCli` and `runLoginCli` need to pass `APPMIXER_TEST_CONFIG` so chained CLI invocations share state. Also add a per-test helper to create a fresh config file.

**Files:**
- Modify: `test/e2e/helpers.ts`

- [ ] **Step 1: Add a per-test config path helper**

In `test/e2e/helpers.ts`, add these imports at the top alongside the existing ones:

```ts
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
```

And add this module-level state alongside the existing `serverInfo`/`testToken`/`testBaseUrl` declarations:

```ts
let testConfigPath: string;
```

- [ ] **Step 2: Initialize a fresh config path per test**

In `setupMockServer`, replace the `beforeEach(() => { resetStore(); })` block with:

```ts
  beforeEach(() => {
    resetStore();
    const dir = mkdtempSync(join(tmpdir(), "cli-cfg-"));
    testConfigPath = join(dir, "config.json");
  });
```

- [ ] **Step 3: Export `getTestConfigPath` for tests that need it**

Add near the other exports:

```ts
export function getTestConfigPath(): string {
  return testConfigPath;
}
```

- [ ] **Step 4: Thread the env var into both spawners**

In `runCli`, add `APPMIXER_TEST_CONFIG: testConfigPath` to the `env` object:

```ts
    env: {
      ...process.env,
      CLI_TEST_MODE: "true",
      APPMIXER_TOKEN: testToken,
      APPMIXER_BASE_URL: testBaseUrl,
      APPMIXER_TEST_CONFIG: testConfigPath,
    },
```

In `runLoginCli`, add `CLI_TEST_MODE: "true"` and `APPMIXER_TEST_CONFIG: testConfigPath` to the `env` object. Remove the existing `APPMIXER_BASE_URL` line since login tests no longer rely on it being auto-set (they pass it explicitly):

```ts
    env: {
      ...process.env,
      CLI_TEST_MODE: "true",
      APPMIXER_TEST_CONFIG: testConfigPath,
      APPMIXER_BASE_URL: testBaseUrl,
    },
```

(Keep `APPMIXER_BASE_URL` — the existing login tests use it in the login flag resolution chain and removing it would break them unnecessarily.)

- [ ] **Step 5: Run the full test suite**

Run: `bun test`
Expected: existing `runCli`-based tests still pass because `getSession()` still short-circuits on `CLI_TEST_MODE + APPMIXER_TOKEN`. Login e2e tests may still fail (error-message updates come in Task 10).

- [ ] **Step 6: Commit**

```bash
git add test/e2e/helpers.ts
git commit -m "test: thread APPMIXER_TEST_CONFIG through e2e helpers"
```

---

## Task 9: E2E tests for the `context` command group

**Files:**
- Create: `test/e2e/context.test.ts`

- [ ] **Step 1: Write the test file**

Create `test/e2e/context.test.ts`:

```ts
import { test, expect, describe } from "bun:test";
import { setupMockServer, runCli, runLoginCli, getBaseUrl } from "./helpers.ts";

describe("context e2e", () => {
  setupMockServer();

  test("context set creates a new context", async () => {
    const result = await runCli(
      "context",
      "set",
      "prod",
      "--base-url",
      "https://p.example.com",
      "--username",
      "admin",
    );
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Created context: prod");
  });

  test("context set on an existing name updates it", async () => {
    await runCli("context", "set", "prod", "--base-url", "https://p.example.com", "--username", "admin");
    const result = await runCli(
      "context",
      "set",
      "prod",
      "--base-url",
      "https://prod.example.com",
      "--username",
      "admin",
    );
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Updated context: prod");
  });

  test("context set with a different username warns and clears token", async () => {
    await runLoginCli(
      "login",
      "--context",
      "prod",
      "--base-url",
      getBaseUrl(),
      "--username",
      "admin@test.com",
      "--password",
      "test123",
    );
    const result = await runCli(
      "context",
      "set",
      "prod",
      "--base-url",
      getBaseUrl(),
      "--username",
      "different@test.com",
    );
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("username changed");

    const listResult = await runCli("context", "list");
    // The previously-logged-in context should now show "no" for LOGGED IN
    expect(listResult.stdout).toContain("different@test.com");
    expect(listResult.stdout).toMatch(/prod.*no\s*$/m);
  });

  test("context use switches the active context", async () => {
    await runCli("context", "set", "prod", "--base-url", "u1", "--username", "admin");
    await runCli("context", "set", "staging", "--base-url", "u2", "--username", "admin");

    const useResult = await runCli("context", "use", "staging");
    expect(useResult.exitCode).toBe(0);
    expect(useResult.stderr).toContain("Switched to context: staging");

    const currentResult = await runCli("context", "current");
    expect(currentResult.exitCode).toBe(0);
    expect(currentResult.stdout.trim()).toBe("staging");
  });

  test("context use with an unknown name errors", async () => {
    await runCli("context", "set", "prod", "--base-url", "u", "--username", "admin");
    const result = await runCli("context", "use", "nope");
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("does not exist");
    expect(result.stderr).toContain("prod");
  });

  test("context current errors when no active context", async () => {
    const result = await runCli("context", "current");
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("no active context");
  });

  test("context list shows all contexts with active marker", async () => {
    await runCli("context", "set", "prod", "--base-url", "https://p", "--username", "admin");
    await runCli("context", "set", "staging", "--base-url", "https://s", "--username", "admin");
    await runCli("context", "use", "prod");

    const result = await runCli("context", "list");
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("NAME");
    expect(result.stdout).toContain("prod");
    expect(result.stdout).toContain("staging");
    // Active marker on prod row
    expect(result.stdout).toMatch(/\*\s+prod/);
  });

  test("context list shows 'yes' for logged-in contexts", async () => {
    await runLoginCli(
      "login",
      "--context",
      "prod",
      "--base-url",
      getBaseUrl(),
      "--username",
      "admin@test.com",
      "--password",
      "test123",
    );
    const result = await runCli("context", "list");
    expect(result.stdout).toMatch(/prod.*yes/);
  });

  test("context delete --yes removes the context", async () => {
    await runCli("context", "set", "prod", "--base-url", "u", "--username", "admin");
    await runCli("context", "set", "staging", "--base-url", "u", "--username", "admin");

    const result = await runCli("context", "delete", "prod", "--yes");
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Deleted context: prod");

    const listResult = await runCli("context", "list");
    expect(listResult.stdout).not.toContain("prod");
    expect(listResult.stdout).toContain("staging");
  });

  test("context delete on the active context clears activeContext with warning", async () => {
    await runCli("context", "set", "prod", "--base-url", "u", "--username", "admin");
    await runCli("context", "use", "prod");

    const result = await runCli("context", "delete", "prod", "--yes");
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Deleted active context");

    const currentResult = await runCli("context", "current");
    expect(currentResult.exitCode).toBe(1);
  });

  test("context delete without --yes in non-tty refuses", async () => {
    await runCli("context", "set", "prod", "--base-url", "u", "--username", "admin");
    const result = await runCli("context", "delete", "prod");
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("non-interactive shell");
  });

  test("context delete on a missing name errors", async () => {
    const result = await runCli("context", "delete", "nope", "--yes");
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("does not exist");
  });
});
```

- [ ] **Step 2: Run the tests**

Run: `bun test test/e2e/context.test.ts`
Expected: PASS, 12 tests.

- [ ] **Step 3: Commit**

```bash
git add test/e2e/context.test.ts
git commit -m "test: add e2e coverage for context commands"
```

---

## Task 10: Update `test/e2e/login.test.ts` for new behavior

The existing tests assert old error-message strings and assume password is required. They need updating for the new prompt path and `--context` creation semantics.

**Files:**
- Modify: `test/e2e/login.test.ts`

- [ ] **Step 1: Replace the file's contents**

Overwrite `test/e2e/login.test.ts` with:

```ts
import { test, expect, describe } from "bun:test";
import { setupMockServer, runLoginCli, runCli, getBaseUrl } from "./helpers.ts";

describe("login e2e", () => {
  setupMockServer();

  test("successful login with new context prints confirmation", async () => {
    const baseUrl = getBaseUrl();
    const result = await runLoginCli(
      "login",
      "--context",
      "prod",
      "--username",
      "admin@test.com",
      "--password",
      "test123",
      "--base-url",
      baseUrl,
    );
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Logged in as admin@test.com");
    expect(result.stderr).toContain("[context: prod]");
  });

  test("bad credentials exit with code 1", async () => {
    const baseUrl = getBaseUrl();
    const result = await runLoginCli(
      "login",
      "--context",
      "prod",
      "--username",
      "wrong@test.com",
      "--password",
      "wrongpass",
      "--base-url",
      baseUrl,
    );
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Login failed");
  });

  test("login with no context and no active context errors", async () => {
    const result = await runLoginCli(
      "login",
      "--username",
      "admin@test.com",
      "--password",
      "test123",
      "--base-url",
      getBaseUrl(),
    );
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("No active context");
  });

  test("login --context <new> without --base-url errors clearly", async () => {
    const result = await runLoginCli(
      "login",
      "--context",
      "new",
      "--username",
      "admin@test.com",
      "--password",
      "test123",
    );
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("does not exist");
    expect(result.stderr).toContain("base-url");
  });

  test("login prompts for password via APPMIXER_TEST_PASSWORD", async () => {
    const baseUrl = getBaseUrl();
    // APPMIXER_TEST_PASSWORD is set via the helper
    const { stdout, stderr, exitCode } = await spawnLoginWithEnv(
      ["login", "--context", "prod", "--base-url", baseUrl, "--username", "admin@test.com"],
      { APPMIXER_TEST_PASSWORD: "test123" }
    );
    expect(exitCode).toBe(0);
    expect(stderr).toContain("Logged in as admin@test.com");
  });

  test("after login, downstream commands pick up the active context", async () => {
    const baseUrl = getBaseUrl();
    const loginResult = await runLoginCli(
      "login",
      "--context",
      "prod",
      "--base-url",
      baseUrl,
      "--username",
      "admin@test.com",
      "--password",
      "test123",
    );
    expect(loginResult.exitCode).toBe(0);

    // runCli short-circuits via CLI_TEST_MODE+APPMIXER_TOKEN, so this test
    // exercises the legacy path. The check that login wrote to the test-config
    // file is done in test/auth.test.ts unit tests.
    const currentResult = await runCli("context", "current");
    expect(currentResult.exitCode).toBe(0);
    expect(currentResult.stdout.trim()).toBe("prod");
  });
});

async function spawnLoginWithEnv(
  args: string[],
  extraEnv: Record<string, string>
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const { join } = await import("node:path");
  const { getTestConfigPath } = await import("./helpers.ts");
  const proc = Bun.spawn(["bun", join(import.meta.dir, "../../src/index.ts"), ...args], {
    env: {
      ...process.env,
      CLI_TEST_MODE: "true",
      APPMIXER_TEST_CONFIG: getTestConfigPath(),
      APPMIXER_BASE_URL: getBaseUrl(),
      ...extraEnv,
    },
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;
  return { stdout, stderr, exitCode };
}
```

- [ ] **Step 2: Run the tests**

Run: `bun test test/e2e/login.test.ts`
Expected: PASS, 6 tests.

Run: `bun test`
Expected: full suite green.

- [ ] **Step 3: Commit**

```bash
git add test/e2e/login.test.ts
git commit -m "test: update login e2e for context-based auth"
```

---

## Task 11: Document the new commands in the README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the Authentication section**

In `README.md`, find the `## Authentication` section. Replace its contents (from the heading through the environment-variables table, but BEFORE the `## Commands` heading) with:

```markdown
## Authentication

The CLI manages one or more named "contexts". Each context has a `baseUrl`, `username`, and (after login) a token. Contexts are stored in the OS keychain via `Bun.secrets`.

Create a new context and log in:

```bash
appmixer-adm login --context prod --base-url https://api.example.com --username admin
```

If `--password` is not given, the CLI reads `APPMIXER_PASSWORD` from the environment; if neither is set, it prompts interactively.

Subsequent logins on the same context only need `--context <name>` and the password (via flag, env var, or prompt):

```bash
appmixer-adm login --context prod
```

Omitting `--context` uses the active context (whatever `appmixer-adm context current` prints).

### Environment variables

| Flag | Environment variable |
|------|---------------------|
| `--base-url <url>` | `APPMIXER_BASE_URL` (used only when creating a new context) |
| `--username <username>` | `APPMIXER_USERNAME` (used only when creating a new context) |
| `--password <password>` | `APPMIXER_PASSWORD` |

The env var `APPMIXER_CONTEXT` overrides the active context for a single command without changing which context is active.

### `context` commands

```bash
appmixer-adm context set <name> --base-url <url> --username <user>   # create/update
appmixer-adm context use <name>                                       # switch active
appmixer-adm context list                                             # list all
appmixer-adm context current                                          # print active
appmixer-adm context delete <name> [--yes]                            # remove
```

`context list` prints a table showing each context's base URL, username, and login status (`yes` / `expired` / `no`). The active context is marked with `*`.

`context delete` prompts for confirmation unless `--yes` is passed; it refuses to run in a non-interactive shell without `--yes`.
```

- [ ] **Step 2: Run the full test suite one final time**

Run: `bun test`
Expected: all tests pass.

- [ ] **Step 3: Smoke test help output**

Run: `bun src/index.ts context --help`
Expected: shows the five subcommands.

Run: `bun src/index.ts login --help`
Expected: shows `--context`, `--username`, `--password`, `--base-url`.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: document context commands and context-based login"
```

---

## Self-review notes

- **Spec coverage:**
  - Data model (activeContext + contexts + token/tokenExp) — Task 1
  - loadConfig / saveConfig with three-branch storage — Task 1
  - resolveContext with flag/env/active precedence — Task 2
  - promptPassword with test-mode bypass — Task 3
  - login rewrite (new context, existing context, missing flags, password sources, token writeback, activeContext auto-set) — Task 4
  - CLI login command wiring — Task 5
  - context set / use / list / current / delete — Task 6
  - Command registration — Task 7
  - Test-mode helpers (APPMIXER_TEST_CONFIG) — Task 8
  - Context e2e — Task 9
  - Login e2e updates — Task 10
  - README — Task 11
- **Type consistency:** `Config`, `Context`, `LoginOptions`, `loadConfig`, `saveConfig`, `resolveContext`, `resetTestConfig`, `promptPassword`, `registerContext`, `registerSet`, `registerUse`, `registerList`, `registerCurrent`, `registerDelete` — all referenced consistently.
- **Test mode decision table** is documented upfront (see top of plan) so a reader understands why two paths exist in `getSession`.
- **Legacy path preserved:** existing `runCli` tests for `flows`/`provision`/`acl`/`config`/`service-config` are untouched; their `CLI_TEST_MODE + APPMIXER_TOKEN + APPMIXER_BASE_URL` shortcut still works in the refactored `getSession`.
- **No placeholders:** every step contains actual code or an exact command.
- **Migration:** explicit — Task plan has no migration task; the spec states old keys are ignored and users re-login.
