"use server";

import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";
import { PlanRepository } from "../repositories/PlanRepository";
import type { CreateUserPlanInput, CreateUserPlanResult } from "../services/PlanService";
import { PlanService } from "../services/PlanService";

export async function createUserPlan(input: CreateUserPlanInput): Promise<CreateUserPlanResult> {
  const service = new PlanService(new PlanRepository(createSupabaseServerClient()));
  return service.createUserPlan(input);
}

export type {
  CreatePlannerPlanResult,
  CreateUserPlanInput,
  CreateUserPlanResult,
} from "../services/PlanService";
