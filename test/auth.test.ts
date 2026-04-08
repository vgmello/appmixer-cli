import { test, expect, describe } from "bun:test";
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
