import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { readGeoapifyCoordinates, validateGeoapifyQuery } from "@/features/search/lib/geoapify/validateQuery";
import { fetchGeoapifyPlaceSearch } from "@/features/search/services/GeoapifyService";

export const runtime = "edge";
export const dynamic = "force-dynamic";

async function handleLocalSearch(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = validateGeoapifyQuery(searchParams, "name");
  if (typeof name !== "string") {
    return name;
  }

  const { lat, lon } = readGeoapifyCoordinates(searchParams);

  try {
    const results = await fetchGeoapifyPlaceSearch(name, lat, lon);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("place search failed:", { hasCoordinates: lat != null && lon != null }, error);
    return NextResponse.json({ error: "Failed to search places." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleLocalSearch(req);
}
