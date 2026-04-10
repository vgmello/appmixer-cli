export type Flow = Record<string, unknown> & { flowId?: string };

export const PRESERVE_FROM_REMOTE = ["userId", "sharedWith"] as const;

const VOLATILE = ["mtime", "btime"] as const;
const NOT_RECONCILED = ["stage"] as const;

export const STRIP_FOR_DIFF: string[] = [
  ...VOLATILE,
  ...NOT_RECONCILED,
  ...PRESERVE_FROM_REMOTE,
];

export function normalize(flow: Flow): Flow {
  const out: Flow = {};
  for (const [key, value] of Object.entries(flow)) {
    if (STRIP_FOR_DIFF.includes(key)) continue;
    out[key] = value;
  }
  return out;
}

export interface LocalFile {
  path: string;
  content: Flow;
}

export interface CreateEntry {
  path: string;
  content: Flow;
  staleId?: string;
}

export interface UpdateEntry {
  path: string;
  content: Flow;
  remote: Flow;
}

export interface SkipEntry {
  path: string;
  flowId: string;
}

export interface PruneEntry {
  flowId: string;
  name: string;
}

export interface Plan {
  creates: CreateEntry[];
  updates: UpdateEntry[];
  skips: SkipEntry[];
  prunes: PruneEntry[];
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function computePlan(
  localFiles: LocalFile[],
  remoteFlows: Flow[],
  options: { prune: boolean }
): Plan {
  const plan: Plan = { creates: [], updates: [], skips: [], prunes: [] };
  const remoteById = new Map<string, Flow>();
  for (const flow of remoteFlows) {
    if (typeof flow.flowId === "string") {
      remoteById.set(flow.flowId, flow);
    }
  }
  const referencedRemoteIds = new Set<string>();

  for (const file of localFiles) {
    const localId = file.content.flowId;
    if (typeof localId !== "string") {
      plan.creates.push({ path: file.path, content: file.content });
      continue;
    }

    const remote = remoteById.get(localId);
    if (!remote) {
      plan.creates.push({
        path: file.path,
        content: file.content,
        staleId: localId,
      });
      continue;
    }

    referencedRemoteIds.add(localId);
    if (deepEqual(normalize(file.content), normalize(remote))) {
      plan.skips.push({ path: file.path, flowId: localId });
    } else {
      plan.updates.push({ path: file.path, content: file.content, remote });
    }
  }

  if (options.prune) {
    for (const flow of remoteFlows) {
      const id = flow.flowId;
      if (typeof id !== "string") continue;
      if (referencedRemoteIds.has(id)) continue;
      plan.prunes.push({ flowId: id, name: String(flow.name ?? "") });
    }
  }

  return plan;
}
