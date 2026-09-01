export type ApplicationErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_SERVER_ERROR";

export type ApplicationErrorOptions = {
  /**
   * Underlying technical cause (e.g. an upstream Supabase error). Kept internal;
   * it must never leak into a user-facing message.
   */
  cause?: unknown;
};

/**
 * Transport-agnostic domain error. Independent of Next.js, Supabase and tRPC:
 * a single conversion to a transport error happens at the adapter boundary.
 *
 * `message` is the safe, user-visible message. The technical `cause` stays
 * internal and must be redacted before it reaches logs or a response.
 */
export class ApplicationError extends Error {
  constructor(
    readonly code: ApplicationErrorCode,
    message: string,
    options: ApplicationErrorOptions = {}
  ) {
    super(message, options);
    this.name = "ApplicationError";
  }
}
