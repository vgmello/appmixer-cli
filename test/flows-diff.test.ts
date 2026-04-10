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

import { computePlan } from "../src/commands/flows/diff.ts";

describe("computePlan", () => {
  test("local file with no flowId becomes a create", () => {
    const plan = computePlan(
      [{ path: "/a.json", content: { name: "new" } }],
      [],
      { prune: false }
    );
    expect(plan.creates).toEqual([{ path: "/a.json", content: { name: "new" } }]);
    expect(plan.updates).toEqual([]);
    expect(plan.skips).toEqual([]);
    expect(plan.prunes).toEqual([]);
  });

  test("matching content with same flowId becomes a skip", () => {
    const flow = { flowId: "f1", name: "same", flow: { components: {} } };
    const plan = computePlan(
      [{ path: "/a.json", content: flow }],
      [{ ...flow, mtime: 999, userId: "owner" }],
      { prune: false }
    );
    expect(plan.skips).toEqual([{ path: "/a.json", flowId: "f1" }]);
    expect(plan.updates).toEqual([]);
    expect(plan.creates).toEqual([]);
  });

  test("differing content with same flowId becomes an update", () => {
    const local = { flowId: "f1", name: "local", flow: { components: {} } };
    const remote = { flowId: "f1", name: "remote", flow: { components: {} }, userId: "owner" };
    const plan = computePlan(
      [{ path: "/a.json", content: local }],
      [remote],
      { prune: false }
    );
    expect(plan.updates).toEqual([{ path: "/a.json", content: local, remote }]);
    expect(plan.skips).toEqual([]);
  });

  test("local flowId not present remotely becomes a stale-id create", () => {
    const local = { flowId: "f-stale", name: "ghost" };
    const plan = computePlan(
      [{ path: "/a.json", content: local }],
      [{ flowId: "f-other", name: "other" }],
      { prune: false }
    );
    expect(plan.creates).toEqual([
      { path: "/a.json", content: local, staleId: "f-stale" },
    ]);
  });

  test("remote-only flow is ignored when prune is false", () => {
    const plan = computePlan(
      [],
      [{ flowId: "f1", name: "orphan" }],
      { prune: false }
    );
    expect(plan.prunes).toEqual([]);
  });

  test("remote-only flow becomes a prune when prune is true", () => {
    const plan = computePlan(
      [],
      [{ flowId: "f1", name: "orphan" }],
      { prune: true }
    );
    expect(plan.prunes).toEqual([{ flowId: "f1", name: "orphan" }]);
  });

  test("mixed: create, update, skip, prune in one plan", () => {
    const updateLocal = { flowId: "f-up", name: "new-name" };
    const updateRemote = { flowId: "f-up", name: "old-name", userId: "owner" };
    const skipFlow = { flowId: "f-skip", name: "same" };
    const newLocal = { name: "fresh" };

    const plan = computePlan(
      [
        { path: "/up.json", content: updateLocal },
        { path: "/skip.json", content: skipFlow },
        { path: "/new.json", content: newLocal },
      ],
      [updateRemote, skipFlow, { flowId: "f-orphan", name: "orphan" }],
      { prune: true }
    );

    expect(plan.creates).toEqual([{ path: "/new.json", content: newLocal }]);
    expect(plan.updates).toEqual([
      { path: "/up.json", content: updateLocal, remote: updateRemote },
    ]);
    expect(plan.skips).toEqual([{ path: "/skip.json", flowId: "f-skip" }]);
    expect(plan.prunes).toEqual([{ flowId: "f-orphan", name: "orphan" }]);
  });
});
