import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { generatePlannerMetadata } from "@/features/plan/lib/generatePlannerMetadata";
import { getPlannerExperience, type PlannerExperience } from "@/features/plan/lib/getPlannerExperience";
import { ApplicationError } from "@/lib/errors";
import { PlanIdView } from "@/modules/planner/planid-view";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ planId: string }>;
  searchParams: Promise<{ dest?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { planId } = await params;
  return generatePlannerMetadata(planId);
}

export default async function PlannerPlanPage({ params, searchParams }: PageProps) {
  const { planId } = await params;
  const { dest } = await searchParams;

  let experience: PlannerExperience;
  try {
    experience = await getPlannerExperience({
      identifier: planId,
      dest,
    });
  } catch (error) {
    if (error instanceof ApplicationError) {
      if (error.code === "UNAUTHORIZED") redirect("/login");
      notFound();
    }
    throw error;
  }

  return <PlanIdView experience={experience} />;
}
