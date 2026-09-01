import { NextResponse } from "next/server";

import { GEOAPIFY_MIN_QUERY_LENGTH } from "@/shared/lib/geoapify/config";

/**
 * Validates a Geoapify text query and returns its normalized value.
 */
export function validateGeoapifyQuery(searchParams: URLSearchParams, param: string): string | NextResponse {
  const value = searchParams.get(param)?.trim() ?? "";
  if (!value) {
    return NextResponse.json({ error: "Query is required." }, { status: 400 });
  }

  if (value.length < GEOAPIFY_MIN_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `Query must be at least ${GEOAPIFY_MIN_QUERY_LENGTH} characters.` },
      { status: 400 }
    );
  }

  return value;
}

export function readGeoapifyCoordinates(searchParams: URLSearchParams): { lat?: number; lon?: number } {
  const lat = parseFiniteCoordinate(searchParams.get("lat"));
  const lon = parseFiniteCoordinate(searchParams.get("lon"));

  return { lat, lon };
}

function parseFiniteCoordinate(value: string | null): number | undefined {
  if (!value) return undefined;

  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : undefined;
}
