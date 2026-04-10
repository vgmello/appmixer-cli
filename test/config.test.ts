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
