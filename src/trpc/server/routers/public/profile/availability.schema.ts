import { z } from "zod";

export const checkUsernameAvailabilitySchema = z.object({
  username: z.string().trim().min(1),
});

export type CheckUsernameAvailabilityInput = z.infer<typeof checkUsernameAvailabilitySchema>;
