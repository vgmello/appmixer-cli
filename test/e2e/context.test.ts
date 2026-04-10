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
