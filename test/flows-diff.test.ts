import { test, expect, describe } from "bun:test";
import { normalize, STRIP_FOR_DIFF, PRESERVE_FROM_REMOTE } from "../src/commands/flows/diff.ts";

describe("normalize", () => {
  test("removes volatile fields", () => {
    const result = normalize({
      flowId: "f1",
      name: "x",
      mtime: 123,
      btime: 456,
      flow: { components: {} },
    });
    expect(result).toEqual({
      flowId: "f1",
      name: "x",
      flow: { components: {} },
    });
  });

  test("removes preserved-from-remote fields", () => {
    const result = normalize({
      flowId: "f1",
      name: "x",
      userId: "owner",
      sharedWith: [{ user: "a" }],
    });
    expect(result).toEqual({ flowId: "f1", name: "x" });
  });

  test("removes stage", () => {
    const result = normalize({ flowId: "f1", stage: "running" });
    expect(result).toEqual({ flowId: "f1" });
  });

  test("does not mutate the input", () => {
    const input = { flowId: "f1", mtime: 1, userId: "u" };
    normalize(input);
    expect(input).toEqual({ flowId: "f1", mtime: 1, userId: "u" });
  });

  test("STRIP_FOR_DIFF is the union of strip lists", () => {
    expect(STRIP_FOR_DIFF).toContain("mtime");
    expect(STRIP_FOR_DIFF).toContain("btime");
    expect(STRIP_FOR_DIFF).toContain("stage");
    expect(STRIP_FOR_DIFF).toContain("userId");
    expect(STRIP_FOR_DIFF).toContain("sharedWith");
  });

  test("PRESERVE_FROM_REMOTE lists owner and sharing", () => {
    expect(PRESERVE_FROM_REMOTE).toEqual(["userId", "sharedWith"]);
  });
});
