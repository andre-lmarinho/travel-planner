"use client";

import { Toaster } from "@/shared/ui/toast/Toast";

import { TRPCProvider } from "./_trpc/trpc-provider";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      {children}
      <Toaster />
    </TRPCProvider>
  );
}
