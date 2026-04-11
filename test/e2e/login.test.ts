import { test, expect, describe } from "bun:test";
import { setupMockServer, runLoginCli, runCli, getBaseUrl, getTestConfigPath } from "./helpers.ts";
import { join } from "node:path";

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
    const result = await spawnLoginWithEnv(
      ["login", "--context", "new", "--username", "admin@test.com", "--password", "test123"],
      { APPMIXER_BASE_URL: undefined },
    );
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("does not exist");
    expect(result.stderr).toContain("base-url");
  });

  test("login prompts for password via APPMIXER_TEST_PASSWORD", async () => {
    const baseUrl = getBaseUrl();
    const { stderr, exitCode } = await spawnLoginWithEnv(
      ["login", "--context", "prod", "--base-url", baseUrl, "--username", "admin@test.com"],
      { APPMIXER_TEST_PASSWORD: "test123" }
    );
    expect(exitCode).toBe(0);
    expect(stderr).toContain("Logged in as admin@test.com");
  });

  test("after login, context current reflects the active context", async () => {
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

    const currentResult = await runCli("context", "current");
    expect(currentResult.exitCode).toBe(0);
    expect(currentResult.stdout.trim()).toBe("prod");
  });
});

async function spawnLoginWithEnv(
  args: string[],
  extraEnv: Record<string, string | undefined>
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const merged: Record<string, string> = {
    ...process.env,
    CLI_TEST_MODE: "true",
    APPMIXER_TEST_CONFIG: getTestConfigPath(),
    APPMIXER_BASE_URL: getBaseUrl(),
  };
  for (const [k, v] of Object.entries(extraEnv)) {
    if (v === undefined) {
      delete merged[k];
    } else {
      merged[k] = v;
    }
  }
  const proc = Bun.spawn(["bun", join(import.meta.dir, "../../src/index.ts"), ...args], {
    env: merged,
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
