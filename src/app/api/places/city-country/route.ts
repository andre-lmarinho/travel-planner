import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { readGeoapifyCoordinates, validateGeoapifyQuery } from "@/features/search/lib/geoapify/validateQuery";
import { fetchGeoapifyAutocomplete } from "@/features/search/services/GeoapifyService";

export const runtime = "edge";
export const dynamic = "force-dynamic";

async function handleCityCountryAutocomplete(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = validateGeoapifyQuery(searchParams, "text");
  if (typeof text !== "string") {
    return text;
  }

  const { lat, lon } = readGeoapifyCoordinates(searchParams);

  try {
    const results = await fetchGeoapifyAutocomplete(text, lat, lon);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("city-country autocomplete failed:", { hasCoordinates: lat != null && lon != null }, err);
    return NextResponse.json({ error: "Failed to load suggestions." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleCityCountryAutocomplete(req);
}
