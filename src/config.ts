import { secrets } from "bun";

const SERVICE = "appmixer-adm";
const SECRET_NAME = "config";

export interface Context {
  baseUrl: string;
  username: string;
  token?: string;
  tokenExp?: number;
}

export interface Config {
  activeContext: string | null;
  contexts: Record<string, Context>;
}

const EMPTY: Config = { activeContext: null, contexts: {} };

let inMemoryConfig: Config = structuredClone(EMPTY);

export function resetTestConfig(): void {
  inMemoryConfig = structuredClone(EMPTY);
}

function storageMode(): "file" | "memory" | "keychain" {
  if (process.env.APPMIXER_TEST_CONFIG) return "file";
  if (process.env.CLI_TEST_MODE === "true") return "memory";
  return "keychain";
}

export async function loadConfig(): Promise<Config> {
  const mode = storageMode();

  if (mode === "memory") {
    return structuredClone(inMemoryConfig);
  }

  let raw: string | null;
  if (mode === "file") {
    const path = process.env.APPMIXER_TEST_CONFIG!;
    const file = Bun.file(path);
    if (!(await file.exists())) return structuredClone(EMPTY);
    raw = await file.text();
  } else {
    raw = await secrets.get({ service: SERVICE, name: SECRET_NAME });
  }

  if (!raw) return structuredClone(EMPTY);

  try {
    return JSON.parse(raw) as Config;
  } catch (err) {
    throw new Error(
      `Config is corrupt. Run 'login' to reset it. (${(err as Error).message})`
    );
  }
}

export async function saveConfig(config: Config): Promise<void> {
  const mode = storageMode();
  const raw = JSON.stringify(config);

  if (mode === "memory") {
    inMemoryConfig = structuredClone(config);
    return;
  }

  if (mode === "file") {
    await Bun.write(process.env.APPMIXER_TEST_CONFIG!, raw);
    return;
  }

  await secrets.set({ service: SERVICE, name: SECRET_NAME }, raw);
}
