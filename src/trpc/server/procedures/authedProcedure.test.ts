import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { Viewer } from "@/features/auth/lib/session";
import type { Database } from "@/supabase/types";
import { createTRPCInnerContext } from "../createContext";
import { createCallerFactory, router } from "../trpc";
import { authedProcedure } from "./authedProcedure";

const USER_ID = "00000000-0000-4000-8000-000000000001";

const testRouter = router({
  ping: authedProcedure.query(() => "pong"),
});

function createTestContext(viewer: Viewer | null = { email: "user@example.com", id: USER_ID }) {
  return createTRPCInnerContext({
    viewer,
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
