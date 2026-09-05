import { isRecord, readString } from "@/lib/typeGuards";

import { ApplicationError } from "./ApplicationError";

export type ErrorIdentifierValue = string | number | boolean | null | undefined;
export type ErrorIdentifiers = Record<string, ErrorIdentifierValue>;

function formatIdentifiers(identifiers?: ErrorIdentifiers): string {
  if (!identifiers) return "";
  const parts = Object.entries(identifiers)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value ?? "null"}`);
  return parts.length ? ` (${parts.join(" ")})` : "";
}

function formatCause(cause: unknown): string | null {
  if (cause == null) return null;
  if (cause instanceof Error && cause.message) return cause.message;
  if (typeof cause === "string") return cause;
  if (isRecord(cause)) {
    const message = readString(cause.message);
    const details = readString(cause.details);
    const hint = readString(cause.hint);
    const code = readString(cause.code);
    const parts = [message, details, hint, code ? `code=${code}` : null].filter((part): part is string =>
      Boolean(part)
    );
    return parts.length ? parts.join(" | ") : null;
  }
  return null;
}

/**
 * Technical repository/infrastructure error from a Supabase call.
 *
 * Always an `INTERNAL_SERVER_ERROR`-level failure carrying the failing
 * `operation` and the identifying arguments (`identifiers`) so it can be
 * correlated in logs. It must NOT be converted directly into a domain or
 * transport error: services convert it into a domain `ApplicationError`.
 */
export class SupabaseError extends ApplicationError {
  constructor(
    readonly operation: string,
    readonly identifiers: ErrorIdentifiers = {},
    options: { cause?: unknown } = {}
  ) {
    const identifierText = formatIdentifiers(identifiers);
    const details = formatCause(options.cause);
    const message = details
      ? `Supabase error during ${operation}${identifierText}. ${details}`
      : `Supabase error during ${operation}${identifierText}.`;

    super("INTERNAL_SERVER_ERROR", message, { cause: options.cause });
    this.name = "SupabaseError";
  }
}

export function formatSupabaseError(context: {
  operation: string;
  identifiers?: ErrorIdentifiers;
  error?: unknown;
}): SupabaseError {
  return new SupabaseError(context.operation, context.identifiers, { cause: context.error });
}
