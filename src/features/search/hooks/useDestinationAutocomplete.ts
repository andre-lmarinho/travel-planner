"use client";

import { GEOAPIFY_MIN_QUERY_LENGTH } from "@/features/search/lib/geoapify/config";

import type { AutocompletePlace } from "../types";
import { createGeoapifySuggestionHook } from "./createGeoapifySuggestionHook";

/**
 * Geoapify autocomplete tailored to city/state/country lookups (used in creation flows).
 */
export const useDestinationAutocomplete = createGeoapifySuggestionHook<AutocompletePlace>({
  endpoint: "/api/places/city-country",
  queryKeyPrefix: "home-destination-autocomplete",
  minimumQueryLength: GEOAPIFY_MIN_QUERY_LENGTH,
  paramName: "text",
});
