"use server";

import { createPlanService } from "../services/createPlanService";

export async function updatePlanDates(planId: string, from: Date, to: Date): Promise<void> {
  const { service } = createPlanService();
  return service.updatePlanDates(planId, from, to);
}
