import { BudgetRepository } from "@/features/budget/repositories/BudgetRepository";
import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";
import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";

import { PlanRepository } from "../repositories/PlanRepository";
import { PlanService } from "./PlanService";

export function createPlanService() {
  const client = createSupabaseServerClient();
  const repo = new PlanRepository(client);
  const service = new PlanService(repo, new BudgetRepository(client), new ProfileRepository(client));
  return { repo, service };
}
