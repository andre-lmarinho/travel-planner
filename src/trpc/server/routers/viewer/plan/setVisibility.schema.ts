import { z } from "zod";

export const setPlanVisibilitySchema = z.object({
  planId: z.string().trim().min(1),
  isPublic: z.boolean(),
});

export type SetPlanVisibilityInput = z.infer<typeof setPlanVisibilitySchema>;
