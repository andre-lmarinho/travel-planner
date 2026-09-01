import { z } from "zod";

export const updateMemberSchema = z.object({
  planIdOrSlug: z.string().trim().min(1),
  userId: z.string().trim().min(1),
  tier: z.enum(["admin", "member"]),
});

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
