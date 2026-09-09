const MONEY_KEYS = new Set([
  "opening_balance_minor", "amount_minor", "target_amount_minor", "size_bytes",
]);

export function serializeDatabaseValue(value: unknown, key?: string): unknown {
  if (value === null || value === undefined) return value;
  if (key && MONEY_KEYS.has(key)) return String(value);
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map((item) => serializeDatabaseValue(item));
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([entryKey, item]) => [entryKey, serializeDatabaseValue(item, entryKey)]));
  }
  return value;
}

export function mapDefined(
  value: Record<string, unknown>,
  mapping: Record<string, string>,
): Record<string, unknown> {
  return Object.fromEntries(Object.entries(mapping)
    .filter(([source]) => value[source] !== undefined)
    .map(([source, target]) => [target, value[source]]));
}

export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}
