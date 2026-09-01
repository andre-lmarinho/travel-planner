"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PlannerCreationForm } from "@/features/plan/components/PlannerCreationForm";
import type { UserPlannerSummary } from "@/features/plan/repositories/PlanRepository";
import type { CreatePlannerPlanResult } from "@/features/plan/services/PlanService";
import { DEFAULT_PLAN_COVER_IMAGE } from "@/features/search/config";
import { Card, CardGrid } from "@/ui/components/card";
import { Dialog, DialogContent, DialogHeader, DialogTriggerButton } from "@/ui/components/dialog";
import { Plane, Plus } from "@/ui/components/icon";

interface PlannersSectionProps {
  plans: UserPlannerSummary[];
}

function CreateTripDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handlePlanCreated(plan: CreatePlannerPlanResult) {
    setOpen(false);
    router.push(`/p/${plan.publicSlug ?? plan.planId}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTriggerButton className="border-primary bg-primary text-primary-foreground group flex min-h-48 w-full cursor-pointer flex-col items-center justify-center rounded-xl border p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <span className="bg-primary-foreground/15 flex size-10 items-center justify-center rounded-full">
          <Plus className="size-5" aria-hidden="true" />
        </span>
        <span className="mt-3 text-sm font-semibold">Create a trip</span>
        <span className="mt-1 text-xs opacity-80">Start with a destination</span>
      </DialogTriggerButton>
      <DialogTriggerButton
        className="bg-primary text-primary-foreground fixed right-5 bottom-5 inline-flex size-12 cursor-pointer items-center justify-center rounded-full shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:right-8 sm:bottom-8"
        aria-label="Create a trip">
        <Plus className="size-5" aria-hidden="true" />
      </DialogTriggerButton>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md p-0">
        <DialogHeader
          title="Create a trip"
          description="Choose a destination and travel dates for your new trip."
        />
        <div className="max-h-[75vh] overflow-y-auto p-4">
          <PlannerCreationForm onPlanCreated={handlePlanCreated} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PlannersSection({ plans }: PlannersSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Plane className="text-primary h-5 w-5" aria-hidden="true" />
        <h2 className="text-foreground text-base font-semibold">Your trips</h2>
      </div>

      <CardGrid>
        {plans.map((plan) => (
          <Card
            key={plan.id}
            href={`/p/${plan.publicSlug}`}
            title={plan.destination ?? plan.title}
            description={plan.destination ? plan.title : undefined}
            image={plan.coverImage ?? DEFAULT_PLAN_COVER_IMAGE}
          />
        ))}
        <CreateTripDialog />
      </CardGrid>
    </section>
  );
}
