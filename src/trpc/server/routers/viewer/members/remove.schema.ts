import { z } from "zod";

export const removeMemberSchema = z.object({
  planIdOrSlug: z.string().trim().min(1),
  userId: z.string().trim().min(1),
});

export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
