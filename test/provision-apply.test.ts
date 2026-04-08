import { test, expect, describe } from "bun:test";
import { parseProvisionFiles } from "../src/commands/provision/apply.ts";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("parseProvisionFiles", () => {
  test("parses YAML files and merges domains", async () => {
    const dir = await mkdtemp(join(tmpdir(), "provision-"));
    await writeFile(
      join(dir, "config.yaml"),
      'config:\n  - key: "MY_KEY"\n    value: "my_value"\n'
    );
    await writeFile(
      join(dir, "services.yml"),
      'service-config:\n  - service-id: "appmixer:google"\n    client-id: "abc"\n'
    );

    const result = await parseProvisionFiles(dir);

    expect(result.config).toEqual([{ key: "MY_KEY", value: "my_value" }]);
    expect(result.serviceConfig).toEqual([
      { serviceId: "appmixer:google", clientId: "abc" },
    ]);
  });

  test("parses acl with nested types", async () => {
    const dir = await mkdtemp(join(tmpdir(), "provision-"));
    await writeFile(
      join(dir, "acl.yaml"),
      'acl:\n  components:\n    - role: "admin"\n      resource: "*"\n      action: ["*"]\n'
    );

    const result = await parseProvisionFiles(dir);

    expect(result.acl).toEqual({
      components: [{ role: "admin", resource: "*", action: ["*"] }],
    });
  });

  test("merges multiple files with same domain", async () => {
    const dir = await mkdtemp(join(tmpdir(), "provision-"));
    await writeFile(
      join(dir, "a.yaml"),
      'config:\n  - key: "A"\n    value: "1"\n'
    );
    await writeFile(
      join(dir, "b.yaml"),
      'config:\n  - key: "B"\n    value: "2"\n'
    );

    const result = await parseProvisionFiles(dir);

    expect(result.config).toEqual([
      { key: "A", value: "1" },
      { key: "B", value: "2" },
    ]);
  });
});
