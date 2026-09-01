import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseServerClient } from "@/shared/lib/supabaseServer";

import { resetDemoIfStale } from "./resetDemoIfStale";

vi.mock("@/shared/lib/supabaseServer", () => ({
  createSupabaseServerClient: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createSupabaseServerClient);

describe("resetDemoIfStale", () => {
  beforeEach(() => {
    mockedCreateClient.mockReset();
  });

  it("calls maybe_reset_demo when the demo world is stale", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    mockedCreateClient.mockReturnValueOnce({ rpc } as unknown as ReturnType<
      typeof createSupabaseServerClient
    >);

    await resetDemoIfStale();

    expect(rpc).toHaveBeenCalledWith("maybe_reset_demo");
  });

  it("swallows errors so a failed reset never breaks the page", async () => {
    mockedCreateClient.mockReturnValueOnce({
      rpc: vi.fn().mockRejectedValue(new Error("db down")),
    } as unknown as ReturnType<typeof createSupabaseServerClient>);

    await expect(resetDemoIfStale()).resolves.toBeUndefined();
  });
});
