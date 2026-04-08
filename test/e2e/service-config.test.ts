import { test, expect, describe } from "bun:test";
import { setupMockServer, runCli } from "./helpers.ts";

describe("service-config e2e", () => {
  setupMockServer();

  test("service-config get-all returns all seeded configs", async () => {
    const result = await runCli("service-config", "get-all");
    expect(result.exitCode).toBe(0);

    const data = JSON.parse(result.stdout);
    expect(data).toBeArray();
    expect(data.length).toBe(2);
    expect(data[0].serviceId).toBe("appmixer:google");
    expect(data[1].serviceId).toBe("appmixer:slack");
  });

  test("service-config get-all with --pattern filters results", async () => {
    const result = await runCli("service-config", "get-all", "--pattern", "google");
    expect(result.exitCode).toBe(0);

    const data = JSON.parse(result.stdout);
    expect(data).toBeArray();
    expect(data.length).toBe(1);
    expect(data[0].serviceId).toBe("appmixer:google");
  });

  test("service-config get returns single config", async () => {
    const result = await runCli("service-config", "get", "appmixer:google");
    expect(result.exitCode).toBe(0);

    const data = JSON.parse(result.stdout);
    expect(data.serviceId).toBe("appmixer:google");
    expect(data.clientId).toBe("google-123");
  });

  test("service-config get with unknown id returns error", async () => {
    const result = await runCli("service-config", "get", "appmixer:nonexistent");
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("404");
  });
});
