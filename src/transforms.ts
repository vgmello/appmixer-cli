function kebabToCamelKey(key: string): string {
  return key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function camelToKebabKey(key: string): string {
  return key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

export function kebabToCamel(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(kebabToCamel);
  }
  if (data !== null && typeof data === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[kebabToCamelKey(key)] = kebabToCamel(value);
    }
    return result;
  }
  return data;
}

export function camelToKebab(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(camelToKebab);
  }
  if (data !== null && typeof data === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[camelToKebabKey(key)] = camelToKebab(value);
    }
    return result;
  }
  return data;
}
