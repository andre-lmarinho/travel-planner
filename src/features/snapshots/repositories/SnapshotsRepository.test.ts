import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/supabase/types";
import { SnapshotsRepository } from "./SnapshotsRepository";

function createMockSupabaseClient(snapshotData: { data: unknown; error: Error | null }) {
  const selectMock = vi.fn().mockReturnThis();
  const mockClient = {
    from: vi.fn((table: string) => {
      if (table === "plan_snapshots") {
        return {
          select: selectMock,
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue(snapshotData),
        };
      }
      return { select: vi.fn().mockReturnThis() };
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  } as unknown as SupabaseClient<Database> & { _selectMock: typeof selectMock };
  (mockClient as { _selectMock?: typeof selectMock })._selectMock = selectMock;
  return mockClient;
}

describe("SnapshotsRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchSnapshot", () => {
    it("returns snapshot when found", async () => {
      const mockSnapshot = {
        plan_id: "plan-1",
        version: 1,
        state: { days: [] },
        updated_at: "2024-01-01T00:00:00.000Z",
      };

      const mockClient = createMockSupabaseClient({ data: mockSnapshot, error: null });

      const result = await new SnapshotsRepository(mockClient).fetchSnapshot("plan-1");

      expect(result).toEqual(mockSnapshot);
      expect(mockClient._selectMock).toHaveBeenCalledWith("plan_id, version, state, updated_at");
    });

    it("returns null when not found", async () => {
      const mockClient = createMockSupabaseClient({ data: null, error: null });

      const result = await new SnapshotsRepository(mockClient).fetchSnapshot("plan-new");

      expect(result).toBeNull();
      expect(mockClient._selectMock).toHaveBeenCalledWith("plan_id, version, state, updated_at");
    });

    it("throws error with context when fetch fails", async () => {
      const mockClient = createMockSupabaseClient({ data: null, error: new Error("DB error") });

      await expect(new SnapshotsRepository(mockClient).fetchSnapshot("plan-1")).rejects.toThrow(
        /fetchSnapshot.*plan-1|plan-1.*fetchSnapshot/
      );
    });
  });
});
