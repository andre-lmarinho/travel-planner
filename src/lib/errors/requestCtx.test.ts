import { describe, expect, it } from "vitest";

import { createRequestCtx } from "./requestCtx";

describe("createRequestCtx", () => {
  it("generates a requestId when no inbound header is present", () => {
    const { requestId } = createRequestCtx();

    expect(requestId).toBeDefined();
    expect(requestId.length).toBeGreaterThan(0);
  });

  it("carries through an inbound x-request-id header", () => {
    const headers = new Headers({ "x-request-id": "trace-123" });

    expect(createRequestCtx(headers).requestId).toBe("trace-123");
  });

  it("ignores a blank inbound header and generates its own", () => {
    const headers = new Headers({ "x-request-id": "   " });

    const { requestId } = createRequestCtx(headers);

    expect(requestId.length).toBeGreaterThan(0);
    expect(requestId.trim()).not.toBe("");
  });
});
