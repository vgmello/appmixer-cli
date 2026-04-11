import { beforeAll, afterAll, beforeEach } from "bun:test";
import { startServer, resetStore } from "../mock-server.ts";
import { join } from "node:path";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

let serverInfo: { port: number; stop: () => void };
let testToken: string;
let testBaseUrl: string;
let testConfigPath: string;

export function setupMockServer() {
  beforeAll(async () => {
    serverInfo = startServer(0);
    testBaseUrl = `http://localhost:${serverInfo.port}`;

    // Obtain a test token by calling the mock auth endpoint directly
    const response = await fetch(`${testBaseUrl}/user/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin@test.com", password: "test123" }),
    });
    const data = await response.json();
    testToken = data.token;
  });

  afterAll(() => {
    serverInfo?.stop();
  });

  beforeEach(() => {
    resetStore();
    const dir = mkdtempSync(join(tmpdir(), "cli-cfg-"));
    testConfigPath = join(dir, "config.json");
  });
}

export function getPort(): number {
  return serverInfo.port;
}

export function getBaseUrl(): string {
  return testBaseUrl;
}

export function getTestConfigPath(): string {
  return testConfigPath;
}

export async function runCli(...args: string[]): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  const proc = Bun.spawn(["bun", join(import.meta.dir, "../../src/index.ts"), ...args], {
    env: {
      ...process.env,
      CLI_TEST_MODE: "true",
      APPMIXER_TOKEN: testToken,
      APPMIXER_BASE_URL: testBaseUrl,
      APPMIXER_TEST_CONFIG: testConfigPath,
    },
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;

  return { stdout, stderr, exitCode };
}

export async function runLoginCli(...args: string[]): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  const proc = Bun.spawn(["bun", join(import.meta.dir, "../../src/index.ts"), ...args], {
    env: {
      ...process.env,
      CLI_TEST_MODE: "true",
      APPMIXER_TEST_CONFIG: testConfigPath,
      APPMIXER_BASE_URL: testBaseUrl,
    },
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;

  return { stdout, stderr, exitCode };
}
