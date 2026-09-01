"use server";

import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";

import { PlanRepository } from "../repositories/PlanRepository";
import { PlanService } from "../services/PlanService";

export async function setPlanVisibility(planId: string, isPublic: boolean): Promise<void> {
  const service = new PlanService(new PlanRepository(createSupabaseServerClient()));
  return service.setPlanVisibility(planId, isPublic);
}
