import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { PlanRepository } from "@/features/plan/repositories/PlanRepository";
import type { PlannerExperience } from "@/features/plan/services/PlanService";
import { PlanService } from "@/features/plan/services/PlanService";
import { ApplicationError } from "@/lib/errors";
import { PlanIdView } from "@/modules/planner/planid-view";
import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ planId: string }>;
  searchParams: Promise<{ dest?: string }>;
};

function buildPlannerContext() {
  const repo = new PlanRepository(createSupabaseServerClient());
  return { repo, service: new PlanService(repo) };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { planId } = await params;
  const { repo } = buildPlannerContext();
  const metadata = await repo.fetchPlanMetadata(planId);
  const titleFromPlan = metadata.title?.trim();
  const titleFromDest = metadata.destinationName?.trim();
  const resolvedTitle = titleFromPlan || titleFromDest || "Planner";
  return { title: `${resolvedTitle} | Turistar App` };
}

export default async function PlannerPlanPage({ params, searchParams }: PageProps) {
  const { planId } = await params;
  const { dest } = await searchParams;

  let experience: PlannerExperience;
  try {
    experience = await buildPlannerContext().service.getPlannerExperience({
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
