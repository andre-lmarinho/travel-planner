import "server-only";

import type {
  AutocompletePlace,
  GeoapifyFeature,
  GeoapifyPlaceDetails,
  GeoapifyPlaceSearchResult,
  GeoapifyResponse,
} from "../types";

const PLACE_SEARCH_LIMIT = 6;

type AutocompleteOptions = {
  text: string;
  lat?: number;
  lon?: number;
  allowedResultTypes: Set<string>;
};

const ADDRESS_ALLOWED_RESULT_TYPES = new Set([
  "building",
  "street",
  "amenity",
  "suburb",
  "neighbourhood",
  "district",
  "quarter",
  "locality",
  "village",
  "hamlet",
]);

const ADDRESS_RESULT_PRIORITY: Record<string, number> = {
  building: 0,
  street: 1,
  amenity: 2,
  suburb: 3,
  neighbourhood: 4,
  district: 5,
  quarter: 6,
  locality: 7,
  village: 8,
  hamlet: 9,
};

function getGeoapifyKey(): string {
  const key = process.env.GEOAPIFY_KEY;
  if (!key) {
    throw new Error("Geoapify configuration failed: GEOAPIFY_KEY is not set.");
  }
  return key;
}

function resolveGeoapifyFeatures(data: GeoapifyResponse): GeoapifyFeature[] {
  if ("features" in data) {
    return data.features;
  }
  if ("results" in data) {
    return data.results.map((result) => ({ properties: result }));
  }
  return [];
}

async function fetchGeoapifyAutocompleteInternal({
  text,
  lat,
  lon,
  allowedResultTypes,
}: AutocompleteOptions): Promise<GeoapifyFeature[]> {
  if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_E2E === "1") {
    return [];
  }
  const key = getGeoapifyKey();

  let url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
    text
  )}&limit=5&apiKey=${key}`;
  if (lat != null && lon != null) {
    url += `&bias=proximity:${lon},${lat}`;
  }

  const res = await fetch(url, {
    cache: "force-cache",
    next: { revalidate: 86400 },
  });
  if (!res.ok) {
    throw new Error(
      `fetchGeoapifyAutocompleteInternal failed: operation=geoapifyAutocomplete text=${text} status=${res.status} lat=${lat ?? "null"} lon=${lon ?? "null"}`
    );
  }

  const data = (await res.json()) as GeoapifyResponse;
  const features = resolveGeoapifyFeatures(data);
  return features.filter((feature) => allowedResultTypes.has(feature.properties.result_type ?? ""));
}

export async function fetchGeoapifyAutocomplete(
  text: string,
  lat?: number,
  lon?: number
): Promise<AutocompletePlace[]> {
  const allowed = new Set(["city", "state", "country"]);
  const features = await fetchGeoapifyAutocompleteInternal({
    text,
    lat,
    lon,
    allowedResultTypes: allowed,
  });
  const priority: Record<string, number> = { city: 0, state: 1, country: 2 };
  features.sort(
    (a, b) =>
      (priority[a.properties.result_type ?? ""] ?? 3) - (priority[b.properties.result_type ?? ""] ?? 3)
  );
  return features.map((feature) => ({
    name: feature.properties.formatted ?? feature.properties.name ?? text,
    latitude: feature.properties.lat,
    longitude: feature.properties.lon,
    country: feature.properties.country,
    countryCode: feature.properties.country_code,
    placeId: String(feature.properties.place_id),
  }));
}

export async function fetchGeoapifyAddressAutocomplete(
  text: string,
  lat?: number,
  lon?: number
): Promise<AutocompletePlace[]> {
  const features = await fetchGeoapifyAutocompleteInternal({
    text,
    lat,
    lon,
    allowedResultTypes: ADDRESS_ALLOWED_RESULT_TYPES,
  });
  features.sort((a, b) => {
    const aType = a.properties.result_type ?? "";
    const bType = b.properties.result_type ?? "";
    return (
      (ADDRESS_RESULT_PRIORITY[aType] ?? Number.MAX_SAFE_INTEGER) -
      (ADDRESS_RESULT_PRIORITY[bType] ?? Number.MAX_SAFE_INTEGER)
    );
  });
  return features.map((feature) => ({
    name: feature.properties.formatted ?? feature.properties.name ?? text,
    latitude: feature.properties.lat,
    longitude: feature.properties.lon,
  }));
}

export async function fetchGeoapifyPlaceSearch(
  text: string,
  lat?: number,
  lon?: number
): Promise<GeoapifyPlaceSearchResult[]> {
  const key = getGeoapifyKey();
  const params = new URLSearchParams({
    text,
    format: "json",
    limit: String(PLACE_SEARCH_LIMIT),
    apiKey: key,
  });
  if (lat != null && lon != null) {
    params.set("bias", `proximity:${lon},${lat}`);
  }

  const requestUrl = `https://api.geoapify.com/v1/geocode/search?${params.toString()}`;
  const res = await fetch(requestUrl, {
    cache: "force-cache",
    next: { revalidate: 86400 },
  });
  if (!res.ok) {
    throw new Error(
      `fetchGeoapifyPlaceSearch failed: text=${text} status=${res.status} lat=${lat ?? "null"} lon=${lon ?? "null"}`
    );
  }

  const data = (await res.json()) as GeoapifyResponse;
  const featureList = resolveGeoapifyFeatures(data);

  return featureList.map(({ properties }) => ({
    placeId: String(properties.place_id),
    name: properties.name ?? properties.formatted ?? text,
    formatted: properties.formatted ?? properties.name ?? text,
    addressLine1: properties.address_line1,
    addressLine2: properties.address_line2,
    latitude: properties.lat,
    longitude: properties.lon,
    resultType: properties.result_type,
    category: properties.category,
    description: properties.description,
  }));
}

/**
 * Fetches detailed information for a place by its Geoapify ID
 * @param placeId - The Geoapify place ID (e.g., from autocomplete results)
 * @returns Place details including Wikidata ID, timezone, address, and location data
 * @throws {Error} If API request fails or no features are returned
 */
export async function fetchGeoapifyPlaceDetails(placeId: string): Promise<GeoapifyPlaceDetails> {
  const key = getGeoapifyKey();
  const params = new URLSearchParams({
    id: placeId,
    format: "json",
    apiKey: key,
  });

  const requestUrl = `https://api.geoapify.com/v2/place-details?${params.toString()}`;
  const res = await fetch(requestUrl, {
    cache: "force-cache",
    next: { revalidate: 86400 },
  });
  if (!res.ok) {
    throw new Error(`fetchGeoapifyPlaceDetails failed: placeId=${placeId} status=${res.status}`);
  }

  const data = (await res.json()) as GeoapifyResponse;
  const feature = resolveGeoapifyFeatures(data)[0];
  if (!feature) {
    throw new Error(`fetchGeoapifyPlaceDetails failed: placeId=${placeId} reason=no_features`);
  }

  const properties = feature.properties;
  return {
    placeId: String(properties.place_id),
    name: properties.name ?? properties.formatted ?? "",
    formatted: properties.formatted ?? "",
    addressLine1: properties.address_line1,
    addressLine2: properties.address_line2,
    street: properties.street,
    district: properties.district,
    city: properties.city,
    county: properties.county,
    state: properties.state,
    stateCode: properties.state_code,
    postcode: properties.postcode,
    country: properties.country,
    countryCode: properties.country_code,
    latitude: properties.lat,
    longitude: properties.lon,
    timezone: properties.timezone
      ? {
          name: properties.timezone.name,
          offsetSTD: properties.timezone.offset_STD,
          offsetDST: properties.timezone.offset_DST,
        }
      : undefined,
    wikidataId: properties.wiki_and_media?.wikidata,
    description: properties.description,
    categories: properties.categories ?? [],
    resultType: properties.result_type,
  };
}
