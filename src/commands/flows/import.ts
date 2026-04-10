import type { Command } from "@commander-js/extra-typings";
import ora from "ora";
import { client } from "../../client.ts";

export function registerImport(flows: Command) {
  flows
    .command("import")
    .description("Fetch a flow from the server and write it to a JSON file")
    .argument("<flowId>", "ID of the flow to fetch")
    .requiredOption("--output <file>", "Path to write the flow JSON to")
    .action(async (flowId, opts) => {
      const spinner = ora(`Fetching flow ${flowId}`).start();
      try {
        const flow = await client.get(`/flows/${encodeURIComponent(flowId)}`);
        await Bun.write(opts.output, JSON.stringify(flow, null, 2) + "\n");
        spinner.succeed(`Wrote ${opts.output}`);
      } catch (err) {
        spinner.fail(`Failed to import ${flowId}: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
