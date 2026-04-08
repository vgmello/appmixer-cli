import { test, expect, describe } from "bun:test";
import { setupMockServer, runCli } from "./helpers.ts";

describe("acl e2e", () => {
  setupMockServer();

  test("acl types get returns type list", async () => {
    const result = await runCli("acl", "types", "get");
    expect(result.exitCode).toBe(0);

    const data = JSON.parse(result.stdout);
    expect(data).toBeArray();
    expect(data).toContain("components");
    expect(data).toContain("routes");
  });

  test("acl rules get components returns seeded rules", async () => {
    const result = await runCli("acl", "rules", "get", "components");
    expect(result.exitCode).toBe(0);

    const data = JSON.parse(result.stdout);
    expect(data).toBeArray();
    expect(data.length).toBe(1);
    expect(data[0].role).toBe("admin");
    expect(data[0].resource).toBe("*");
    expect(data[0].action).toEqual(["*"]);
  });

  test("acl rules get routes returns seeded rules", async () => {
    const result = await runCli("acl", "rules", "get", "routes");
    expect(result.exitCode).toBe(0);

    const data = JSON.parse(result.stdout);
    expect(data).toBeArray();
    expect(data[0].role).toBe("user");
  });

  test("acl resources get components returns resources", async () => {
    const result = await runCli("acl", "resources", "get", "components");
    expect(result.exitCode).toBe(0);

    const data = JSON.parse(result.stdout);
    expect(data).toBeArray();
    expect(data).toContain("*");
  });

  test("acl actions get components returns actions", async () => {
    const result = await runCli("acl", "actions", "get", "components");
    expect(result.exitCode).toBe(0);

    const data = JSON.parse(result.stdout);
    expect(data).toBeArray();
    expect(data).toContain("read");
    expect(data).toContain("create");
  });

  test("acl attributes get components * returns attributes", async () => {
    const result = await runCli("acl", "attributes", "get", "components", "*");
    expect(result.exitCode).toBe(0);

    const data = JSON.parse(result.stdout);
    expect(data).toBeArray();
  });
});
