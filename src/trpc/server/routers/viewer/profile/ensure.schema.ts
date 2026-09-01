import { z } from "zod";

export const ensureProfileSchema = z.object({});
export type EnsureProfileInput = z.infer<typeof ensureProfileSchema>;
