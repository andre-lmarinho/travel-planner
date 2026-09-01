"use server";

import { createPlanService } from "../services/createPlanService";

export async function setPlanVisibility(planId: string, isPublic: boolean): Promise<void> {
  const { service } = createPlanService();
  return service.setPlanVisibility(planId, isPublic);
}
