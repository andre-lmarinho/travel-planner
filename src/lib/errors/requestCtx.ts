/**
 * Request correlation helper. Single source of requestId so every adapter
 * (Route Handler, tRPC, Server Action) correlates errors to the same identifier.
 */

import { randomUUID } from "node:crypto";

export type RequestCtx = {
  requestId: string;
};

/**
 * Build a request correlation context, preferring an inbound `x-request-id`
 * header when present so upstream traces carry through.
 */
export function createRequestCtx(headers?: Headers): RequestCtx {
  const inbound = headers?.get("x-request-id");
  return { requestId: inbound?.trim() || randomUUID() };
}
