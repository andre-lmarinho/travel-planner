import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { vi } from "vitest";

import { GET } from "./route";

const { mockValidateGeoapifyQuery, mockFetchGeoapifyAddressAutocomplete } = vi.hoisted(() => ({
  mockValidateGeoapifyQuery: vi.fn(),
  mockFetchGeoapifyAddressAutocomplete: vi.fn(),
}));

vi.mock("@/shared/lib/server/geoapify/validateQuery", async () => {
  const actual = await vi.importActual<typeof import("@/shared/lib/server/geoapify/validateQuery")>(
    "@/shared/lib/server/geoapify/validateQuery"
  );
  return { ...actual, validateGeoapifyQuery: mockValidateGeoapifyQuery };
});

vi.mock("@/features/search/services/GeoapifyService", () => ({
  fetchGeoapifyAddressAutocomplete: mockFetchGeoapifyAddressAutocomplete,
}));

const createRequest = (search: string): NextRequest =>
  ({
    url: `https://example.com/api/places/address${search}`,
  }) as NextRequest;

describe("GET /api/places/address", () => {
  beforeEach(() => {
    mockValidateGeoapifyQuery.mockReset();
    mockFetchGeoapifyAddressAutocomplete.mockReset();
  });

  it("returns the validation error response when present", async () => {
    const validationError = NextResponse.json({ error: "missing" }, { status: 400 });
    mockValidateGeoapifyQuery.mockReturnValue(validationError);

    const res = await GET(createRequest("?text=aa"));

    expect(res).toBe(validationError);
    expect(mockFetchGeoapifyAddressAutocomplete).not.toHaveBeenCalled();
  });

  it("calls the Geoapify helper with numeric coordinates and returns the results", async () => {
    mockValidateGeoapifyQuery.mockReturnValue("home");
    const results = [{ name: "Street", latitude: 1, longitude: 2 }];
    mockFetchGeoapifyAddressAutocomplete.mockResolvedValue(results);

    const res = await GET(createRequest("?text=home&lat=1.23&lon=-4.56"));

    expect(mockFetchGeoapifyAddressAutocomplete).toHaveBeenCalledWith("home", 1.23, -4.56);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ results });
  });

  it("returns 500 when the helper throws an error", async () => {
    mockValidateGeoapifyQuery.mockReturnValue("home");
    const failure = new Error("boom");
    mockFetchGeoapifyAddressAutocomplete.mockRejectedValue(failure);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await GET(createRequest("?text=home"));

    expect(consoleSpy).toHaveBeenCalledWith(
      "address autocomplete failed:",
      { hasCoordinates: false },
      failure
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Failed to load suggestions." });

    consoleSpy.mockRestore();
  });
});
