import { describe, expect, it, vi } from "vitest";

import type { SnapshotRow, SnapshotsRepository } from "../repositories/SnapshotsRepository";

import { SnapshotsService } from "./SnapshotsService";

function createService(row: SnapshotRow | null) {
  const repo = {
    fetchSnapshot: vi.fn().mockResolvedValue(row),
  } as unknown as SnapshotsRepository;

  return { repo, service: new SnapshotsService(repo) };
}

describe("SnapshotsService", () => {
  it("returns an empty snapshot when the repository has no row", async () => {
    const { repo, service } = createService(null);

    await expect(service.fetchSnapshot("plan-new")).resolves.toEqual({
      version: 0,
      days: [],
      updatedAt: new Date(0).toISOString(),
    });
    expect(repo.fetchSnapshot).toHaveBeenCalledWith("plan-new");
  });

  it("maps persisted snapshot data to the domain shape", async () => {
    const row = {
      plan_id: "plan-1",
      version: 3,
      updated_at: "2026-01-01T00:00:00.000Z",
      state: {
        days: [
          {
            id: "day-1",
            label: "Day 1",
            position: "2048",
            activities: [
              {
                id: "activity-1",
                title: "Visit museum",
                color: "blue",
                position: "2048",
              },
            ],
          },
        ],
      },
    } as unknown as SnapshotRow;
    const { service } = createService(row);

    await expect(service.fetchSnapshot("plan-1")).resolves.toMatchObject({
      version: 3,
      updatedAt: "2026-01-01T00:00:00.000Z",
      days: [
        {
          id: "day-1",
          label: "Day 1",
          position: "2048",
          activities: [
            {
              id: "activity-1",
              title: "Visit museum",
              color: "blue",
              position: "2048",
            },
          ],
        },
      ],
    });
  });

  it("applies defaults for missing day and activity positions", async () => {
    const row = {
      plan_id: "plan-1",
      version: 1,
      updated_at: "2026-01-01T00:00:00.000Z",
      state: {
        days: [
          {
            id: "day-1",
            label: "Day 1",
            activities: [
              {
                id: "activity-1",
                title: "Breakfast",
                color: "green",
              },
            ],
          },
        ],
      },
    } as unknown as SnapshotRow;
    const { service } = createService(row);

    const result = await service.fetchSnapshot("plan-1");

    expect(result.days[0].position).toBe("1024");
    expect(result.days[0].activities[0].position).toBe("1024");
  });

  it("propagates repository failures", async () => {
    const error = new Error("database unavailable");
    const { repo, service } = createService(null);
    vi.mocked(repo.fetchSnapshot).mockRejectedValueOnce(error);

    await expect(service.fetchSnapshot("plan-1")).rejects.toBe(error);
  });
});
