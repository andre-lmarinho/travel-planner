import { z } from "zod";

export const updatePlanTitleSchema = z.object({
  planId: z.string().trim().min(1),
  title: z.string().trim().min(1),
});

export type UpdatePlanTitleInput = z.infer<typeof updatePlanTitleSchema>;
