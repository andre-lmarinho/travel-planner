import type { NextRequest } from "next/server";
import { vi } from "vitest";

import { GEOAPIFY_MIN_QUERY_LENGTH } from "@/features/search/lib/geoapify/config";

import { GET } from "./route";

const { mockFetchGeoapifyPlaceSearch } = vi.hoisted(() => ({
  mockFetchGeoapifyPlaceSearch: vi.fn(),
}));

vi.mock("@/features/search/services/GeoapifyService", () => ({
  fetchGeoapifyPlaceSearch: mockFetchGeoapifyPlaceSearch,
}));

const createRequest = (search: string): NextRequest => {
  return { url: `https://example.com/api/places/search${search}` } as NextRequest;
};

describe("GET /api/places/search", () => {
  beforeEach(() => {
    mockFetchGeoapifyPlaceSearch.mockReset();
  });

  it("returns 400 when the name parameter is missing", async () => {
    const res = await GET(createRequest(""));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Query is required." });
  });

  it("returns 400 when the name parameter is shorter than the minimum characters", async () => {
    const shortQuery = "a".repeat(GEOAPIFY_MIN_QUERY_LENGTH - 1);
    const res = await GET(createRequest(`?name=${shortQuery}`));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: `Query must be at least ${GEOAPIFY_MIN_QUERY_LENGTH} characters.`,
    });
  });

  it("calls Geoapify with the provided query and bias parameters", async () => {
    const results = [{ placeId: "1", name: "Forte", formatted: "Forte de Monte Serrat" }];
    mockFetchGeoapifyPlaceSearch.mockResolvedValue(results);

    const res = await GET(createRequest("?name=forte&lat=-12.9&lon=-38.5"));

    expect(mockFetchGeoapifyPlaceSearch).toHaveBeenCalledWith("forte", -12.9, -38.5);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ results });
  });

  it("logs and returns 500 when Geoapify fails", async () => {
    const error = new Error("network failed");
    mockFetchGeoapifyPlaceSearch.mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await GET(createRequest("?name=forte"));

    expect(consoleSpy).toHaveBeenCalledWith("place search failed:", { hasCoordinates: false }, error);
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Failed to search places." });

    consoleSpy.mockRestore();
  });
});
