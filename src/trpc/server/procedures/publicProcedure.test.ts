import type { SupabaseClient } from "@supabase/supabase-js";
import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { ApplicationError } from "@/lib/errors";

import type { Database } from "@/supabase/types";
import { createTRPCInnerContext } from "../createContext";
import { createCallerFactory, router } from "../trpc";
import { publicProcedure } from "./publicProcedure";

const testRouter = router({
  fail: publicProcedure.query(() => {
    throw new ApplicationError("CONFLICT", "Application error.");
  }),
});

function createTestContext() {
  return createTRPCInnerContext({
    viewer: null,
    requestMeta: { ip: null, requestId: "test", userAgent: null },
    supabase: {} as SupabaseClient<Database>,
  });
}

describe("publicProcedure", () => {
  it("converts ApplicationError into TRPCError", async () => {
    const caller = createCallerFactory(testRouter)(createTestContext());

    await expect(caller.fail()).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Application error.",
    });
    await expect(caller.fail()).rejects.toBeInstanceOf(TRPCError);
  });
});
