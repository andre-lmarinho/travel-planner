import { z } from "zod";

export const getMembersSchema = z.object({
  planIdOrSlug: z.string().trim().min(1),
});

export type GetMembersInput = z.infer<typeof getMembersSchema>;
