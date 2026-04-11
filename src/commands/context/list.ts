import type { Command } from "@commander-js/extra-typings";
import { loadConfig } from "../../config.ts";

function loginStatus(tokenExp?: number): string {
  if (tokenExp === undefined) return "no";
  const now = Math.floor(Date.now() / 1000);
  return tokenExp > now ? "yes" : "expired";
}

export function registerList(context: Command) {
  context
    .command("list")
    .description("List all contexts")
    .action(async () => {
      try {
        const config = await loadConfig();
        const names = Object.keys(config.contexts).sort();
        if (names.length === 0) {
          console.error("No contexts. Run 'login --context <name> --base-url <url> --username <user>' to create one.");
          return;
        }

        const rows = names.map((n) => {
          const ctx = config.contexts[n]!;
          return {
            marker: n === config.activeContext ? "*" : " ",
            name: n,
            baseUrl: ctx.baseUrl,
            username: ctx.username,
            status: loginStatus(ctx.tokenExp),
          };
        });

        const nameW = Math.max(4, ...rows.map((r) => r.name.length));
        const urlW = Math.max(8, ...rows.map((r) => r.baseUrl.length));
        const userW = Math.max(8, ...rows.map((r) => r.username.length));

        const header = `  ${"NAME".padEnd(nameW)}  ${"BASE URL".padEnd(urlW)}  ${"USERNAME".padEnd(userW)}  LOGGED IN`;
        console.log(header);
        for (const r of rows) {
          console.log(
            `${r.marker} ${r.name.padEnd(nameW)}  ${r.baseUrl.padEnd(urlW)}  ${r.username.padEnd(userW)}  ${r.status}`
          );
        }
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
