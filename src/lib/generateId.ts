let fallbackCounter = 0;

/**
 * Generate a unique ID with optional prefix.
 * Uses crypto.randomUUID when available, falls back to getRandomValues,
 * and finally to a timestamp-based ID as last resort.
 */
export function generateId(prefix = ""): string {
  const crypto = globalThis.crypto;

  if (crypto?.randomUUID) {
    return `${prefix}${crypto.randomUUID()}`;
  }

  if (crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${prefix}${hex}`;
  }

  fallbackCounter = (fallbackCounter + 1) % 1_000_000;
  return `${prefix}${Date.now().toString(36)}${fallbackCounter.toString(36)}`;
}
