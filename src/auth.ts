import chalk from "chalk";
import { loadConfig, saveConfig, resolveContext } from "./config.ts";
import { promptPassword } from "./prompts.ts";

interface JwtPayload {
  username: string;
  exp: number;
  [key: string]: unknown;
}

export function decodeJwt(token: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }
  const payload = JSON.parse(atob(parts[1]!));
  return payload as JwtPayload;
}

export interface LoginOptions {
  context?: string;
  baseUrl?: string;
  username?: string;
  password?: string;
}

async function resolveLoginContext(
  opts: LoginOptions
): Promise<{ name: string; baseUrl: string; username: string }> {
  const config = await loadConfig();

  const requested = opts.context ?? config.activeContext;
  if (!requested) {
    throw new Error(
      "No active context. Run 'appmixer-adm login --context <name> --base-url <url> --username <user>' to create one."
    );
  }

  const existing = config.contexts[requested];
  if (existing) {
    return { name: requested, baseUrl: existing.baseUrl, username: existing.username };
  }

  if (!opts.baseUrl || !opts.username) {
    throw new Error(
      `Context '${requested}' does not exist. Pass --base-url and --username to create it.`
    );
  }
  return { name: requested, baseUrl: opts.baseUrl, username: opts.username };
}

async function resolvePassword(opts: LoginOptions): Promise<string> {
  if (opts.password) return opts.password;
  const envPassword = process.env.APPMIXER_PASSWORD ?? process.env.APPMIXER_TEST_PASSWORD;
  if (envPassword) return envPassword;
  return promptPassword("Password:");
}

export async function login(opts: LoginOptions): Promise<void> {
  const { name, baseUrl, username } = await resolveLoginContext(opts);
  const password = await resolvePassword(opts);

  const response = await fetch(`${baseUrl}/user/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Login failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  const token = data.token as string;
  const payload = decodeJwt(token);

  const config = await loadConfig();
  config.contexts[name] = {
    baseUrl,
    username,
    token,
    tokenExp: payload.exp,
  };
  if (!config.activeContext) {
    config.activeContext = name;
  }
  await saveConfig(config);

  console.error(chalk.green(`Logged in as ${username} (${baseUrl}) [context: ${name}]`));
}

export async function getSession(): Promise<{
  token: string;
  baseUrl: string;
  username: string;
}> {
  // Legacy test-mode shortcut: preserves existing runCli test behavior.
  if (
    process.env.CLI_TEST_MODE === "true" &&
    process.env.APPMIXER_TOKEN &&
    process.env.APPMIXER_BASE_URL
  ) {
    const token = process.env.APPMIXER_TOKEN;
    const baseUrl = process.env.APPMIXER_BASE_URL;
    const payload = decodeJwt(token);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) {
      throw new Error("Session expired. Run `appmixer-adm login` first.");
    }
    return { token, baseUrl, username: payload.username };
  }

  const { ctx } = await resolveContext();
  if (!ctx.token || !ctx.tokenExp) {
    throw new Error("Session expired. Run `appmixer-adm login` first.");
  }
  const now = Math.floor(Date.now() / 1000);
  if (ctx.tokenExp <= now) {
    throw new Error("Session expired. Run `appmixer-adm login` first.");
  }
  return { token: ctx.token, baseUrl: ctx.baseUrl, username: ctx.username };
}
