import "server-only";

import type { SnapshotsRepository } from "../repositories/SnapshotsRepository";
import { mapSnapshot, SnapshotRowSchema } from "../repositories/snapshotSchemas";
import type { Snapshot } from "../types";

export class SnapshotsService {
  constructor(private readonly repo: SnapshotsRepository) {}

  async fetchSnapshot(planId: string): Promise<Snapshot> {
    const data = await this.repo.fetchSnapshot(planId);
    const parsed = SnapshotRowSchema.parse(
      data ?? {
        plan_id: planId,
        version: 0,
        state: { days: [] },
        updated_at: new Date(0).toISOString(),
      }
    );

    return mapSnapshot(parsed);
  }
}
