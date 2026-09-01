import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import type { Database } from "@/shared/types/supabase";
import { type AuthContext, createTRPCInnerContext } from "../createContext";
import { createCallerFactory, router } from "../trpc";
import { authedProcedure } from "./authedProcedure";

const USER_ID = "00000000-0000-4000-8000-000000000001";

const testRouter = router({
  ping: authedProcedure.query(() => "pong"),
});

function createTestContext(
  auth: AuthContext | null = {
    email: "user@example.com",
    user: { email: "user@example.com", id: USER_ID },
    userId: USER_ID,
  }
) {
  return createTRPCInnerContext({
    auth,
    requestMeta: { ip: null, requestId: "test", userAgent: null },
    supabase: {} as SupabaseClient<Database>,
  });
}

describe("authedProcedure", () => {
  it("allows authenticated callers", async () => {
    const caller = createCallerFactory(testRouter)(createTestContext());

    await expect(caller.ping()).resolves.toBe("pong");
  });

  it("requires authentication", async () => {
    const caller = createCallerFactory(testRouter)(createTestContext(null));

    await expect(caller.ping()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
