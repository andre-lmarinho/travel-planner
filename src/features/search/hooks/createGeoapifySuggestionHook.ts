"use client";

import { useQuery } from "@tanstack/react-query";

import { GEOAPIFY_MIN_QUERY_LENGTH } from "@/features/search/lib/geoapify/config";

interface SuggestionHookOptions {
  enabled?: boolean;
  latitude?: number;
  longitude?: number;
}

interface SuggestionHookConfig<TResult> {
  endpoint: string;
  queryKeyPrefix: string;
  minimumQueryLength?: number;
  paramName?: string;
  mapResults?: (body: unknown) => TResult[];
}

export interface SuggestionHookResult<TResult> {
  results: TResult[];
  loading: boolean;
  error: boolean;
}

export type SuggestionHook<TResult> = (
  query: string,
  options?: SuggestionHookOptions
) => SuggestionHookResult<TResult>;

export function createGeoapifySuggestionHook<TResult>({
  endpoint,
  queryKeyPrefix,
  minimumQueryLength = GEOAPIFY_MIN_QUERY_LENGTH,
  paramName = "text",
  mapResults,
}: SuggestionHookConfig<TResult>): SuggestionHook<TResult> {
  return function useGeoapifySuggestions(
    query: string,
    options: SuggestionHookOptions = {}
  ): SuggestionHookResult<TResult> {
    const trimmedQuery = query.trim();
    const isEnabled = (options.enabled ?? true) && trimmedQuery.length >= minimumQueryLength;

    const { data, isLoading, isError } = useQuery({
      queryKey: [queryKeyPrefix, trimmedQuery, options.latitude, options.longitude],
      queryFn: async ({ signal }) => {
        const params = new URLSearchParams({ [paramName]: trimmedQuery });
        if (options.latitude != null && options.longitude != null) {
          params.set("lat", String(options.latitude));
          params.set("lon", String(options.longitude));
        }
        const requestUrl = `${endpoint}?${params.toString()}`;
        const res = await fetch(requestUrl, signal ? { signal } : undefined);
        if (!res.ok) {
          const context = [
            "operation=geoapifySuggestions",
            `endpoint=${endpoint}`,
            `query=${trimmedQuery}`,
            `lat=${options.latitude ?? "null"}`,
            `lon=${options.longitude ?? "null"}`,
          ].join(" ");
          throw new Error(`Failed to load suggestions: ${context}`);
        }
        const body = await res.json();
        return mapResults ? mapResults(body) : ((body as { results?: TResult[] }).results ?? []);
      },
      enabled: isEnabled,
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    });

    return {
      results: data ?? [],
      loading: isLoading,
      error: isError,
    };
  };
}
