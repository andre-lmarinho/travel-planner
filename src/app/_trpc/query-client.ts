"use client";

import { MutationCache, QueryClient } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { toast } from "@/shared/ui/toast/Toast";

import type { AppRouter } from "@/trpc/server/routers/_app";

const MAX_QUERY_RETRIES = 3;

function isTRPCClientError(error: unknown): error is TRPCClientError<AppRouter> {
  return error instanceof TRPCClientError;
}

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  const code = isTRPCClientError(error) ? error.data?.code : undefined;

  if (code === "BAD_REQUEST" || code === "FORBIDDEN" || code === "UNAUTHORIZED") {
    return false;
  }

  return failureCount < MAX_QUERY_RETRIES;
}

export function createQueryClient() {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Something went wrong. Try again.");
      },
    }),
    defaultOptions: {
      mutations: { retry: false },
      queries: {
        refetchOnWindowFocus: false,
        retry: shouldRetryQuery,
        staleTime: 1000,
      },
    },
  });
}
