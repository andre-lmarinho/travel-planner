"use server";

import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";

import { PlanRepository } from "../repositories/PlanRepository";
import { PlanService } from "../services/PlanService";

export type DeletePlanResult = {
  redirectTo: string;
};

export async function deletePlan(planId: string): Promise<DeletePlanResult> {
  const service = new PlanService(new PlanRepository(createSupabaseServerClient()));
  const redirectTo = await service.deletePlan(planId);
  return { redirectTo };
}
