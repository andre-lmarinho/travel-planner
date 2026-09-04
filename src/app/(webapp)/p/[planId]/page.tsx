import { notFound, redirect } from "next/navigation";

import { getViewer } from "@/features/auth/lib/session";

import { createPlanService } from "@/features/plan/services/createPlanService";
import type { PlannerExperience } from "@/features/plan/services/PlanService";
import { ApplicationError } from "@/lib/errors";
import { PlanIdView } from "@/modules/planner/planid-view";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ planId: string }>;
  searchParams: Promise<{ dest?: string }>;
};

export default async function PlannerPlanPage({ params, searchParams }: PageProps) {
  const { planId } = await params;
  const { dest } = await searchParams;

  let experience: PlannerExperience;
  try {
    const viewer = await getViewer();
    experience = await createPlanService(viewer).service.getPlannerExperience({
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
