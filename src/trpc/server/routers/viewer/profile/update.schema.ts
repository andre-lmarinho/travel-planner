import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  slug: z.string().trim().min(1).max(28),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
