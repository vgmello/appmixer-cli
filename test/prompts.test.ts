import { test, expect, describe, beforeEach } from "bun:test";
import { promptPassword } from "../src/prompts.ts";

describe("promptPassword", () => {
  beforeEach(() => {
    process.env.CLI_TEST_MODE = "true";
    delete process.env.APPMIXER_TEST_PASSWORD;
  });

  test("returns APPMIXER_TEST_PASSWORD when set in test mode", async () => {
    process.env.APPMIXER_TEST_PASSWORD = "hunter2";
    const result = await promptPassword("Password:");
    expect(result).toBe("hunter2");
  });

  test("throws in test mode when APPMIXER_TEST_PASSWORD is missing", async () => {
    await expect(promptPassword("Password:")).rejects.toThrow(
      /APPMIXER_TEST_PASSWORD/
    );
  });
});
