import { secrets } from "bun";
import chalk from "chalk";

const SERVICE = "appmixer-adm";

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

export async function login(baseUrl: string, username: string, password: string): Promise<void> {
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

  try {
    await secrets.set({ service: SERVICE, name: `token:${baseUrl}` }, token);
    await secrets.set({ service: SERVICE, name: `username:${baseUrl}` }, username);
    await secrets.set({ service: SERVICE, name: "base-url" }, baseUrl);
  } catch (err) {
    console.error(chalk.yellow(`Warning: could not store credentials in keychain: ${(err as Error).message}`));
  }

  const payload = decodeJwt(token);
  console.error(chalk.green(`Logged in as ${payload.username} (${baseUrl})`));
}

export async function getSession(): Promise<{
  token: string;
  baseUrl: string;
  username: string;
}> {
  // Test mode: read from environment variables
  if (process.env.CLI_TEST_MODE === "true") {
    const token = process.env.APPMIXER_TOKEN;
    const baseUrl = process.env.APPMIXER_BASE_URL;
    if (!token || !baseUrl) {
      throw new Error("Session expired. Run `appmixer-adm login` first.");
    }
    const payload = decodeJwt(token);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) {
      throw new Error("Session expired. Run `appmixer-adm login` first.");
    }
    return { token, baseUrl, username: payload.username };
  }

  // Normal mode: read from Bun.secrets
  const baseUrl = await secrets.get({ service: SERVICE, name: "base-url" });
  if (!baseUrl) {
    throw new Error("Session expired. Run `appmixer-adm login` first.");
  }

  const token = await secrets.get({ service: SERVICE, name: `token:${baseUrl}` });
  if (!token) {
    throw new Error("Session expired. Run `appmixer-adm login` first.");
  }

  const payload = decodeJwt(token);
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    throw new Error("Session expired. Run `appmixer-adm login` first.");
  }

  const username = (await secrets.get({ service: SERVICE, name: `username:${baseUrl}` })) ?? payload.username;
  return { token, baseUrl, username };
}
