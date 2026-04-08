import { test, expect, describe } from "bun:test";
import { kebabToCamel, camelToKebab } from "../src/transforms.ts";

describe("kebabToCamel", () => {
  test("converts simple kebab-case key", () => {
    expect(kebabToCamel({ "service-id": "foo" })).toEqual({ serviceId: "foo" });
  });

  test("converts nested objects recursively", () => {
    expect(
      kebabToCamel({ "client-config": { "client-id": "abc" } })
    ).toEqual({ clientConfig: { clientId: "abc" } });
  });

  test("converts objects inside arrays", () => {
    expect(
      kebabToCamel([{ "service-id": "a" }, { "client-id": "b" }])
    ).toEqual([{ serviceId: "a" }, { clientId: "b" }]);
  });

  test("leaves string values unchanged", () => {
    expect(kebabToCamel({ key: "some-kebab-value" })).toEqual({
      key: "some-kebab-value",
    });
  });

  test("leaves keys without hyphens unchanged", () => {
    expect(kebabToCamel({ role: "admin" })).toEqual({ role: "admin" });
  });
});

describe("camelToKebab", () => {
  test("converts simple camelCase key", () => {
    expect(camelToKebab({ serviceId: "foo" })).toEqual({ "service-id": "foo" });
  });

  test("converts nested objects recursively", () => {
    expect(
      camelToKebab({ clientConfig: { clientId: "abc" } })
    ).toEqual({ "client-config": { "client-id": "abc" } });
  });

  test("converts objects inside arrays", () => {
    expect(
      camelToKebab([{ serviceId: "a" }, { clientId: "b" }])
    ).toEqual([{ "service-id": "a" }, { "client-id": "b" }]);
  });

  test("leaves string values unchanged", () => {
    expect(camelToKebab({ key: "someCamelValue" })).toEqual({
      key: "someCamelValue",
    });
  });

  test("leaves keys without uppercase unchanged", () => {
    expect(camelToKebab({ role: "admin" })).toEqual({ role: "admin" });
  });
});
