"use client";

import { GEOAPIFY_MIN_QUERY_LENGTH } from "@/features/search/lib/geoapify/config";

import { useDebounce } from "./useDebounce";

/**
 * Debounces a search query and returns trimmed text plus a flag for minimum length readiness.
 */
export function useDebouncedQuery(
  value: string,
  minimumLength: number = GEOAPIFY_MIN_QUERY_LENGTH
): {
  debounced: string;
  trimmed: string;
  canSearch: boolean;
} {
  const debounced = useDebounce(value);
  const trimmed = debounced.trim();
  const canSearch = trimmed.length >= minimumLength;

  return { debounced, trimmed, canSearch };
}
