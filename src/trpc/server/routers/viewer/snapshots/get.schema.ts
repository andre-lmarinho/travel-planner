import { z } from "zod";

export const getSnapshotSchema = z.object({
  planId: z.string().trim().min(1),
});

export type GetSnapshotInput = z.infer<typeof getSnapshotSchema>;
