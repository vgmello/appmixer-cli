import { test, expect, describe, beforeEach } from "bun:test";
import { loadConfig, saveConfig, resetTestConfig, resolveContext } from "../src/config.ts";

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
