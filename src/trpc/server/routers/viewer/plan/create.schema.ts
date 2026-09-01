import { z } from "zod";

export const createPlanSchema = z.object({
  title: z.string().trim().min(1),
  destination: z.object({
    name: z.string().trim().min(1),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    country: z.string().trim().optional(),
    placeId: z.string().trim().optional(),
  }),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isPublic: z.boolean().optional(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
