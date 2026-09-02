import { createMockSupabaseClient } from "@tests/utils/mocks";
import { describe, expect, it } from "vitest";

import { createTRPCInnerContext } from "../../createContext";
import { createCallerFactory } from "../../trpc";
import { appRouter } from "../_app";

function createUnauthenticatedCaller() {
  return createCallerFactory(appRouter)(
    createTRPCInnerContext({
      viewer: null,
      requestMeta: { ip: null, requestId: "viewer-auth-test", userAgent: null },
      supabase: createMockSupabaseClient(),
    })
  );
}

describe("viewerRouter authentication boundary", () => {
  it.each([
    ["profile", () => createUnauthenticatedCaller().viewer.profile.get({})],
    ["profile.ensure", () => createUnauthenticatedCaller().viewer.profile.ensure({})],
    ["budget", () => createUnauthenticatedCaller().viewer.budget.get({ planId: "plan-1" })],
    ["events", () => createUnauthenticatedCaller().viewer.events.list({ planId: "plan-1", sinceVersion: 0 })],
    ["snapshots", () => createUnauthenticatedCaller().viewer.snapshots.get({ planId: "plan-1" })],
    ["members", () => createUnauthenticatedCaller().viewer.members.get({ planIdOrSlug: "plan-1" })],
    [
      "plan",
      () => createUnauthenticatedCaller().viewer.plan.updateTitle({ planId: "plan-1", title: "Trip" }),
    ],
  ])("requires authentication for viewer.%s", async (_domain, call) => {
    await expect(call()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
