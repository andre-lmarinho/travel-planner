"use client";

import { GEOAPIFY_MIN_QUERY_LENGTH } from "@/features/search/lib/geoapify/config";
import type { AutocompletePlace } from "@/features/search/types";

import { createGeoapifySuggestionHook } from "./createGeoapifySuggestionHook";

/**
 * Planner-specific Geoapify autocomplete that narrows results to street-level addresses.
 */
export const useAddressAutocomplete = createGeoapifySuggestionHook<AutocompletePlace>({
  endpoint: "/api/places/address",
  queryKeyPrefix: "planner-address-autocomplete",
  minimumQueryLength: GEOAPIFY_MIN_QUERY_LENGTH,
  paramName: "text",
});
