"use server";

import { createPlanService } from "../services/createPlanService";

export async function updatePlanTitle(planId: string, newTitle: string): Promise<void> {
  const { service } = createPlanService();
  return service.updatePlanTitle(planId, newTitle);
}
