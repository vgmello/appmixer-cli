import { password } from "@inquirer/prompts";

export async function promptPassword(message: string): Promise<string> {
  if (process.env.CLI_TEST_MODE === "true") {
    const value = process.env.APPMIXER_TEST_PASSWORD;
    if (value === undefined) {
      throw new Error(
        "CLI_TEST_MODE is set but APPMIXER_TEST_PASSWORD is missing. Set it in the test helper."
      );
    }
    return value;
  }

  if (!process.stdin.isTTY) {
    throw new Error(
      "No password provided. Use --password, APPMIXER_PASSWORD, or run in an interactive shell."
    );
  }

  return password({ message, mask: true });
}
