/**
 * Check if a value is a non-null object (record), excluding arrays.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Check if a value is a non-empty string.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/**
 * Extract a string value, returning null if not a non-empty string.
 */
export function readString(value: unknown): string | null {
  return isNonEmptyString(value) ? value : null;
}

/**
 * Extract a string from a record by key, returning null if not found or empty.
 */
export function readStringKey(record: Record<string, unknown>, key: string): string | null {
  return readString(record[key]);
}

/**
 * Check if a value is a finite number.
 */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
