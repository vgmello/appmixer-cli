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
