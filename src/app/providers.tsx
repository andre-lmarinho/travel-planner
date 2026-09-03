"use client";

import { PostHogProvider } from "@/lib/analytics/PostHogProvider";
import { Toaster } from "@/ui/components/toast/Toast";

import { TRPCProvider } from "./_trpc/trpc-provider";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <PostHogProvider>
        {children}
        <Toaster />
      </PostHogProvider>
    </TRPCProvider>
  );
}
