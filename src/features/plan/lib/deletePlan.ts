"use server";

import { createPlanService } from "../services/createPlanService";

export type DeletePlanResult = {
  redirectTo: string;
};

export async function deletePlan(planId: string): Promise<DeletePlanResult> {
  const { service } = createPlanService();
  const redirectTo = await service.deletePlan(planId);
  return { redirectTo };
}
