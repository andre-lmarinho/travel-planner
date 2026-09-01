"use client";

import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";

import { trpc } from "@/trpc/react";

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        transformer: superjson,
        url: "/api/trpc",
      }),
    ],
  });
}
