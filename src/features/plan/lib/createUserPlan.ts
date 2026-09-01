"use server";

import { createPlanService } from "../services/createPlanService";
import type { CreateUserPlanInput, CreateUserPlanResult } from "../services/PlanService";

export async function createUserPlan(input: CreateUserPlanInput): Promise<CreateUserPlanResult> {
  const { service } = createPlanService();
  return service.createUserPlan(input);
}

export type {
  CreatePlannerPlanResult,
  CreateUserPlanInput,
  CreateUserPlanResult,
} from "../services/PlanService";
