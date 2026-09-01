/**
 * Redaction helpers for error logging and responses.
 *
 * Guarantees that secrets and PII never leak through serialized error context:
 * check that redacted output contains a placeholder instead of the raw value.
 */

const PLACEHOLDER = "[REDACTED]";

const SECRET_KEY_RE =
  /(password|passwd|secret|token|key|authorization|cookie|session|service_role|apikey|api_key)/i;

export function isSecretKey(key: string): boolean {
  return SECRET_KEY_RE.test(key);
}

/**
 * Redact `value` when its lookup key looks like a secret. Used to sanitize
 * arbitrary identifier objects before logging (e.g. keys like `serviceRoleKey`).
 */
export function redactIfSecret(key: string, value: unknown): unknown {
  return isSecretKey(key) ? PLACEHOLDER : value;
}

/**
 * Redact sensitive keys from a flat object (one level deep), returning a new
 * object. Non-object input is passed through.
 */
export function redactRecord(input: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    output[key] = redactIfSecret(key, value);
  }
  return output;
}

/**
 * Replace bearer tokens / credentials embedded in a URL string (query or userinfo).
 */
export function redactUrl(url: string): string {
  if (url.includes("@")) {
    url = url.replace(/\/\/[^/@\s]+@/, `//${PLACEHOLDER}@`);
  }
  return url.replace(/([?&](?:token|key|api_key|apikey|code|access_token)=)[^&#\s]+/gi, `$1${PLACEHOLDER}`);
}
