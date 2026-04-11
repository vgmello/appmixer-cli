import { test, expect, describe, beforeAll, afterAll, beforeEach } from "bun:test";
import { decodeJwt, getSession } from "../src/auth.ts";

function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

describe("decodeJwt", () => {
  test("decodes payload from a JWT string", () => {
    const token = makeJwt({ username: "admin@test.com", exp: 9999999999 });
    const payload = decodeJwt(token);
    expect(payload.username).toBe("admin@test.com");
    expect(payload.exp).toBe(9999999999);
  });

  test("returns correct username field", () => {
    const token = makeJwt({ username: "user@example.com", exp: 9999999999 });
    const payload = decodeJwt(token);
    expect(payload.username).toBe("user@example.com");
  });

  test("throws on malformed token", () => {
    expect(() => decodeJwt("not-a-jwt")).toThrow();
  });
});

describe("getSession in test mode", () => {
  const originalEnv = { ...process.env };

  test("reads from env vars when CLI_TEST_MODE is true", async () => {
    const token = makeJwt({ username: "test@example.com", exp: 9999999999 });
    process.env.CLI_TEST_MODE = "true";
    process.env.APPMIXER_TOKEN = token;
    process.env.APPMIXER_BASE_URL = "http://localhost:3000";

    const session = await getSession();
    expect(session.token).toBe(token);
    expect(session.baseUrl).toBe("http://localhost:3000");
    expect(session.username).toBe("test@example.com");

    // Restore
    process.env = { ...originalEnv };
  });

  test("throws when CLI_TEST_MODE is true but token is missing", async () => {
    process.env.CLI_TEST_MODE = "true";
    delete process.env.APPMIXER_TOKEN;
    process.env.APPMIXER_BASE_URL = "http://localhost:3000";

    await expect(getSession()).rejects.toThrow();

    // Restore
    process.env = { ...originalEnv };
  });

  test("throws when CLI_TEST_MODE is true but token is expired", async () => {
    const token = makeJwt({ username: "test@example.com", exp: 1000000000 });
    process.env.CLI_TEST_MODE = "true";
    process.env.APPMIXER_TOKEN = token;
    process.env.APPMIXER_BASE_URL = "http://localhost:3000";

    await expect(getSession()).rejects.toThrow("Session expired");

    // Restore
    process.env = { ...originalEnv };
  });
});

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
