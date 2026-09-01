import type { NextRequest } from "next/server";
import { vi } from "vitest";

import { GEOAPIFY_MIN_QUERY_LENGTH } from "@/shared/lib/geoapify/config";

import { GET } from "./route";

const { mockFetchGeoapifyAutocomplete } = vi.hoisted(() => ({
  mockFetchGeoapifyAutocomplete: vi.fn(),
}));

vi.mock("@/features/search/services/GeoapifyService", () => ({
  fetchGeoapifyAutocomplete: mockFetchGeoapifyAutocomplete,
}));

const createRequest = (search: string): NextRequest => {
  return { url: `https://example.com/api/places/city-country${search}` } as NextRequest;
};

describe("GET /api/places/city-country", () => {
  beforeEach(() => {
    mockFetchGeoapifyAutocomplete.mockReset();
  });

  it("returns 400 when the text parameter is missing", async () => {
    const res = await GET(createRequest(""));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Query is required." });
  });

  it("returns 400 when the text parameter is shorter than the minimum characters", async () => {
    const shortQuery = "a".repeat(GEOAPIFY_MIN_QUERY_LENGTH - 1);
    const res = await GET(createRequest(`?text=${shortQuery}`));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: `Query must be at least ${GEOAPIFY_MIN_QUERY_LENGTH} characters.`,
    });
  });

  it("rejects whitespace-only text", async () => {
    const res = await GET(createRequest("?text=%20%20%20"));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Query is required." });
  });

  it("proxies Geoapify autocomplete results and parses coordinates", async () => {
    const results = [{ id: "1", formatted: "Paris, France" }];
    mockFetchGeoapifyAutocomplete.mockResolvedValue(results);

    const res = await GET(createRequest("?text=paris&lat=48.8566&lon=2.3522"));

    expect(mockFetchGeoapifyAutocomplete).toHaveBeenCalledWith("paris", 48.8566, 2.3522);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ results });
  });

  it("ignores invalid coordinates", async () => {
    mockFetchGeoapifyAutocomplete.mockResolvedValue([]);

    await GET(createRequest("?text=paris&lat=not-a-number&lon=Infinity"));

    expect(mockFetchGeoapifyAutocomplete).toHaveBeenCalledWith("paris", undefined, undefined);
  });

  it("logs the error and returns 500 when Geoapify fails", async () => {
    const error = new Error("network failed");
    mockFetchGeoapifyAutocomplete.mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await GET(createRequest("?text=paris"));

    expect(consoleSpy).toHaveBeenCalledWith(
      "city-country autocomplete failed:",
      { hasCoordinates: false },
      error
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Failed to load suggestions." });

    consoleSpy.mockRestore();
  });
});
