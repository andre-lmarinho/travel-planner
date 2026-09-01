import { createMockSupabaseClient } from "@tests/utils/mocks";
import { describe, expect, it } from "vitest";

import { getAuthedServerCaller, getPublicServerCaller } from "./serverCaller";

const user = {
  email: "user@example.com",
  id: "00000000-0000-4000-8000-000000000001",
};

describe("serverCaller", () => {
  it("keeps protected budget procedures unavailable to public server calls", async () => {
    const caller = getPublicServerCaller(createMockSupabaseClient());

    await expect(caller.budget.get({ planId: "plan-1" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("uses the injected request-scoped Supabase client for authenticated calls", async () => {
    const caller = getAuthedServerCaller(
      user,
      createMockSupabaseClient({
        fromData: {
          profiles: { avatar_url: null, display_name: "Ada", id: user.id, slug: "ada" },
        },
      })
    );

    await expect(caller.viewer.profile()).resolves.toMatchObject({ slug: "ada", userId: user.id });
  });
});
