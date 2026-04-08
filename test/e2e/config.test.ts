import { test, expect, describe } from "bun:test";
import { setupMockServer, runCli } from "./helpers.ts";

describe("config e2e", () => {
  setupMockServer();

  test("config get-all returns seeded data as JSON", async () => {
    const result = await runCli("config", "get-all");
    expect(result.exitCode).toBe(0);

    const data = JSON.parse(result.stdout);
    expect(data).toBeArray();
    expect(data.length).toBe(2);
    expect(data[0].key).toBe("API_URL");
    expect(data[0].value).toBe("https://api.example.com");
    expect(data[1].key).toBe("LOG_LEVEL");
    expect(data[1].value).toBe("info");
  });

  test("config get-all outputs valid JSON to stdout", async () => {
    const result = await runCli("config", "get-all");
    expect(result.exitCode).toBe(0);
    expect(() => JSON.parse(result.stdout)).not.toThrow();
  });

  test("stderr shows Running as message", async () => {
    const result = await runCli("config", "get-all");
    expect(result.stderr).toContain("Running as:");
    expect(result.stderr).toContain("admin@test.com");
  });
});
