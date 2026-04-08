import { test, expect, describe } from "bun:test";
import { setupMockServer, runLoginCli, getBaseUrl } from "./helpers.ts";

describe("login e2e", () => {
  setupMockServer();

  test("successful login prints confirmation", async () => {
    const baseUrl = getBaseUrl();
    const result = await runLoginCli(
      "login",
      "--username", "admin@test.com",
      "--password", "test123",
      "--base-url", baseUrl
    );
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Logged in as admin@test.com");
    expect(result.stderr).toContain(baseUrl);
  });

  test("bad credentials exits with code 1", async () => {
    const baseUrl = getBaseUrl();
    const result = await runLoginCli(
      "login",
      "--username", "wrong@test.com",
      "--password", "wrongpass",
      "--base-url", baseUrl
    );
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Login failed");
  });

  test("missing username shows error", async () => {
    const baseUrl = getBaseUrl();
    const result = await runLoginCli(
      "login",
      "--password", "test123",
      "--base-url", baseUrl
    );
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("--username or APPMIXER_USERNAME is required");
  });

  test("missing password shows error", async () => {
    const baseUrl = getBaseUrl();
    const result = await runLoginCli(
      "login",
      "--username", "admin@test.com",
      "--base-url", baseUrl
    );
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("--password or APPMIXER_PASSWORD is required");
  });
});
