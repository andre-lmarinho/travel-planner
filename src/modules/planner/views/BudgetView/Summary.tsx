"use client";

import { DollarSign } from "@/ui/components/icon";
import { AmountDisplay } from "./AmountDisplay";
export function Summary({ totalSpent, persistError }: { totalSpent: number; persistError: string | null }) {
  if (persistError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {persistError}
      </p>
    );
  }

  return (
    <section aria-label="Summary">
      <article className="border-border bg-card rounded-2xl border p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-semibold tracking-[-0.02em]">Total spent</h2>
            <p className="text-muted-foreground mt-0.5 text-sm">All recorded expenses</p>
          </div>
          <span className="bg-card text-foreground inline-flex size-10 shrink-0 items-center justify-center rounded-xl">
            <DollarSign className="size-5" strokeWidth={2.25} aria-hidden="true" />
          </span>
        </div>

        <div className="mt-6">
          <AmountDisplay value={totalSpent} variant="span" ariaLabel="Total spent" />
        </div>
      </article>
    </section>
  );
}
