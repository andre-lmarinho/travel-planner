"use server";

import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";

import { PlanRepository } from "../repositories/PlanRepository";
import { PlanService } from "../services/PlanService";

export async function updatePlanDates(planId: string, from: Date, to: Date): Promise<void> {
  const service = new PlanService(new PlanRepository(createSupabaseServerClient()));
  return service.updatePlanDates(planId, from, to);
}
