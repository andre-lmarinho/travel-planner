import type { NextRequest } from "next/server";
import { vi } from "vitest";

import { GET } from "./route";

const { mockFetchGeoapifyPlaceDetails, mockFetchWikidataImage } = vi.hoisted(() => ({
  mockFetchGeoapifyPlaceDetails: vi.fn(),
  mockFetchWikidataImage: vi.fn(),
}));

vi.mock("@/features/search/services/GeoapifyService", () => ({
  fetchGeoapifyPlaceDetails: mockFetchGeoapifyPlaceDetails,
}));
vi.mock("@/features/search/services/WikidataService", () => ({
  fetchWikidataImage: mockFetchWikidataImage,
}));

const createRequest = (search: string): NextRequest => {
  return { url: `https://example.com/api/places/details${search}` } as NextRequest;
};

describe("GET /api/places/details", () => {
  beforeEach(() => {
    mockFetchGeoapifyPlaceDetails.mockReset();
    mockFetchWikidataImage.mockReset();
  });

  it("returns 400 when the placeId parameter is missing", async () => {
    const res = await GET(createRequest(""));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Place ID is required." });
  });

  it("returns details and attempts to fetch the Wikidata image", async () => {
    const details = { placeId: "pid", name: "Forte de Monte Serrat", wikidataId: "Q1" };
    mockFetchGeoapifyPlaceDetails.mockResolvedValue(details as never);
    mockFetchWikidataImage.mockResolvedValue("https://image.jpg");

    const res = await GET(createRequest("?placeId=pid"));

    expect(mockFetchGeoapifyPlaceDetails).toHaveBeenCalledWith("pid");
    expect(mockFetchWikidataImage).toHaveBeenCalledWith("Q1");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      details,
      wikidataImageUrl: "https://image.jpg",
    });
  });

  it("logs and returns 500 when Geoapify place details fail", async () => {
    const error = new Error("failed");
    mockFetchGeoapifyPlaceDetails.mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await GET(createRequest("?placeId=pid"));

    expect(consoleSpy).toHaveBeenCalledWith("place details failed:", { hasPlaceId: true }, error);
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Failed to load place details." });

    consoleSpy.mockRestore();
  });

  it("returns details and skips Wikidata when wikidataId is missing", async () => {
    const details = { placeId: "pid", name: "Forte de Monte Serrat", wikidataId: null };
    mockFetchGeoapifyPlaceDetails.mockResolvedValue(details as never);

    const res = await GET(createRequest("?placeId=pid"));

    expect(mockFetchGeoapifyPlaceDetails).toHaveBeenCalledWith("pid");
    expect(mockFetchWikidataImage).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      details,
      wikidataImageUrl: undefined,
    });
  });

  it("logs and returns 500 when Wikidata image fetch fails", async () => {
    const details = { placeId: "pid", name: "Forte de Monte Serrat", wikidataId: "Q1" };
    const error = new Error("wikidata failed");

    mockFetchGeoapifyPlaceDetails.mockResolvedValue(details as never);
    mockFetchWikidataImage.mockRejectedValue(error);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await GET(createRequest("?placeId=pid"));

    expect(mockFetchGeoapifyPlaceDetails).toHaveBeenCalledWith("pid");
    expect(mockFetchWikidataImage).toHaveBeenCalledWith("Q1");
    expect(consoleSpy).toHaveBeenCalledWith("place details failed:", { hasPlaceId: true }, error);
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Failed to load place details." });

    consoleSpy.mockRestore();
  });
});
