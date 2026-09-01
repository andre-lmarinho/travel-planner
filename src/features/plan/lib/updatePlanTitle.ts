"use server";

import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";

import { PlanRepository } from "../repositories/PlanRepository";
import { PlanService } from "../services/PlanService";

export async function updatePlanTitle(planId: string, newTitle: string): Promise<void> {
  const service = new PlanService(new PlanRepository(createSupabaseServerClient()));
  return service.updatePlanTitle(planId, newTitle);
}
