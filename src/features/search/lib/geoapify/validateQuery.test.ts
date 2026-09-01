import { NextResponse } from "next/server";
import { GEOAPIFY_MIN_QUERY_LENGTH } from "@/features/search/lib/geoapify/config";
import { validateGeoapifyQuery } from "./validateQuery";

describe("validateGeoapifyQuery", () => {
  it("returns an error response when the parameter is missing", async () => {
    const result = validateGeoapifyQuery(new URLSearchParams(), "text");

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Query is required." });
  });

  it("returns an error response when the value is shorter than the minimum", async () => {
    const shortValue = "a".repeat(GEOAPIFY_MIN_QUERY_LENGTH - 1);
    const params = new URLSearchParams({ text: shortValue });
    const result = validateGeoapifyQuery(params, "text");

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: `Query must be at least ${GEOAPIFY_MIN_QUERY_LENGTH} characters.`,
    });
  });

  it("returns the string when the parameter is valid", () => {
    const validValue = "a".repeat(GEOAPIFY_MIN_QUERY_LENGTH);
    const params = new URLSearchParams({ text: validValue });

    const result = validateGeoapifyQuery(params, "text");

    expect(result).toBe(validValue);
  });
});
