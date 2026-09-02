import type { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

function createRequest(segments: string[]): NextRequest {
  return { url: "https://example.com/api/tiles/" + segments.join("/") + ".png" } as unknown as NextRequest;
}

describe("GET /api/tiles/[...segments]", () => {
  afterEach(() => {
    delete process.env.CARTO_KEY;
    vi.restoreAllMocks();
  });

  it("returns 400 when the segment count is wrong", async () => {
    const res = await GET(createRequest(["voyager", "3", "1"]), {
      params: Promise.resolve({ segments: ["voyager", "3", "1"] }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for a disallowed style", async () => {
    const res = await GET(createRequest(["evil", "3", "1", "2"]), {
      params: Promise.resolve({ segments: ["evil", "3", "1", "2"] }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for out-of-range x/y/z", async () => {
    const bad = [
      ["-1", "1", "2"],
      ["0", "1", "2", "3"],
      ["21", "1", "2", "3"],
      ["3", "9", "1", "2"],
      ["3", "3", "abc", "2"],
    ];
    for (const segments of bad) {
      const res = await GET(createRequest(segments), { params: Promise.resolve({ segments }) });
      expect(res.status).toBe(400);
    }
  });

  it("returns 500 when CARTO is not configured", async () => {
    const segments = ["voyager", "3", "1", "2"];
    const res = await GET(createRequest(segments), { params: Promise.resolve({ segments }) });
    expect(res.status).toBe(500);
  });

  it("proxies a valid CARTO tile without leaking the key", async () => {
    process.env.CARTO_KEY = "server-key";
    const fakeBody = new ReadableStream({
      start: (controller) => controller.enqueue(new Uint8Array([1, 2, 3])),
    });

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(fakeBody, { status: 200 }));

    const segments = ["voyager", "3", "1", "2.png"];
    const res = await GET(createRequest(segments), { params: Promise.resolve({ segments }) });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");

    const upstreamUrl = fetchMock.mock.calls[0][0] as string;
    expect(upstreamUrl).toBe("https://basemaps.cartocdn.com/rastertiles/voyager/3/1/2.png?key=server-key");
    expect(upstreamUrl).not.toContain("test-key");
  });
});
