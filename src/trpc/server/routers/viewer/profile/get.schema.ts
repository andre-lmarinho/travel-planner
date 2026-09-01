import { z } from "zod";

export const ZGetProfileSchema = z.object({});

export type TGetProfileSchema = z.infer<typeof ZGetProfileSchema>;
