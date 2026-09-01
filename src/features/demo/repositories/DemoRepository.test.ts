import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "@/shared/types/supabase";

import { DemoRepository } from "./DemoRepository";

function makeRepo(client: SupabaseClient<Database>): DemoRepository {
  return new DemoRepository(client);
}

describe("DemoRepository", () => {
  describe("resetIfStale", () => {
    it("calls the maybe_reset_demo rpc", async () => {
      const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
      const supabase = { rpc } as unknown as SupabaseClient<Database>;

      await makeRepo(supabase).resetIfStale();

      expect(rpc).toHaveBeenCalledWith("maybe_reset_demo");
    });

    it("throws a formatted error when Supabase fails", async () => {
      const failure = new Error("rpc failure");
      const supabase = {
        rpc: vi.fn().mockResolvedValue({ data: null, error: failure }),
      } as unknown as SupabaseClient<Database>;

      await expect(makeRepo(supabase).resetIfStale()).rejects.toThrow(
        expect.objectContaining({ operation: "resetIfStale" })
      );
    });
  });
});
