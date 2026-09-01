import { createMockSupabaseClient } from "@tests/utils/mocks";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createTRPCInnerContext } from "../../../createContext";
import { createCallerFactory } from "../../../trpc";
import { appRouter } from "../../_app";

const { isUsernameAvailableMock } = vi.hoisted(() => ({
  isUsernameAvailableMock: vi.fn(),
}));

vi.mock("@/features/auth/lib/isUsernameAvailable", () => ({
  isUsernameAvailable: isUsernameAvailableMock,
}));

function createCaller() {
  return createCallerFactory(appRouter)(
    createTRPCInnerContext({
      auth: null,
      requestMeta: { ip: null, requestId: "public-profile-test", userAgent: null },
      supabase: createMockSupabaseClient(),
    })
  );
}

describe("public profile router", () => {
  beforeEach(() => {
    isUsernameAvailableMock.mockReset();
  });
  it("returns username availability", async () => {
    isUsernameAvailableMock.mockResolvedValue(true);

    await expect(createCaller().public.profile.availability({ username: "alice" })).resolves.toEqual({
      available: true,
    });
  });

  it("rejects an empty username before reaching the service", async () => {
    await expect(createCaller().public.profile.availability({ username: " " })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(isUsernameAvailableMock).not.toHaveBeenCalled();
  });
});
