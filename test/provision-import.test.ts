import { test, expect, describe } from "bun:test";
import { buildProvisionYaml } from "../src/commands/provision/import.ts";

describe("buildProvisionYaml", () => {
  test("transforms config data to kebab-case YAML string", () => {
    const yaml = buildProvisionYaml("config", [
      { key: "MY_KEY", value: "my_value" },
    ]);
    expect(yaml).toContain("config:");
    expect(yaml).toContain("key: MY_KEY");
    expect(yaml).toContain("value: my_value");
  });

  test("transforms service-config data with camelCase to kebab-case keys", () => {
    const yaml = buildProvisionYaml("service-config", [
      { serviceId: "appmixer:google", clientId: "abc" },
    ]);
    expect(yaml).toContain("service-config:");
    expect(yaml).toContain("service-id: \"appmixer:google\"");
    expect(yaml).toContain("client-id: abc");
  });

  test("transforms acl data with nested types", () => {
    const yaml = buildProvisionYaml("acl", {
      components: [{ role: "admin", resource: "*", action: ["*"] }],
    });
    expect(yaml).toContain("acl:");
    expect(yaml).toContain("components:");
    expect(yaml).toContain("role: admin");
  });
});
