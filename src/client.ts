import chalk from "chalk";
import { getSession } from "./auth.ts";

let sessionDisplayed = false;

async function resolveSession() {
  const session = await getSession();
  if (!sessionDisplayed) {
    console.error(chalk.dim(`Running as: ${session.username} (${session.baseUrl})`));
    sessionDisplayed = true;
  }
  return session;
}

async function request(method: string, path: string, body?: unknown): Promise<unknown> {
  const { token, baseUrl } = await resolveSession();

  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const options: RequestInit = { method, headers };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (err) {
    throw new Error(
      `Could not connect to ${baseUrl}. Check your connection and base URL.`
    );
  }

  if (response.status === 401) {
    throw new Error("Session expired. Run `appmixer-adm login` first.");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed (${response.status}): ${text}`);
  }

  const text = await response.text();
  if (!text) return {};
  return JSON.parse(text);
}

export const client = {
  get: (path: string) => request("GET", path),
  post: (path: string, body: unknown) => request("POST", path, body),
  put: (path: string, body: unknown) => request("PUT", path, body),
  delete: (path: string) => request("DELETE", path),
};
