import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SupabaseUser } from "@/features/auth/lib/session";
import { requireUser, UnauthorizedError } from "@/features/auth/lib/session";

import { ensureProfile } from "./ensureProfile";

const { mockUpsertProfile } = vi.hoisted(() => ({ mockUpsertProfile: vi.fn() }));

vi.mock("@/features/auth/lib/session", () => {
  class UnauthorizedError extends Error {
    constructor(message = "Authentication required.") {
      super(message);
      this.name = "UnauthorizedError";
    }
  }

  return {
    requireUser: vi.fn(),
    UnauthorizedError,
  };
});

vi.mock("@/features/profile/repositories/ProfileRepository", () => ({
  ProfileRepository: class {
    upsertProfile = mockUpsertProfile;
  },
}));
vi.mock("@/shared/lib/supabaseServer", () => ({
  createSupabaseServerClient: vi.fn(),
}));

type UpsertResponse = { slug: string } | Error;

type UpsertCall = {
  userId: string;
  slug: string;
  displayName: string | null;
  avatarUrl: string | null;
};

const mockRequireUser = vi.mocked(requireUser);

function buildUpsertError(code: string, message: string): Error {
  return new Error(message, { cause: { code, message } });
}

function queueUpsertResponses(responses: UpsertResponse[]) {
  const queue = [...responses];
  const calls: UpsertCall[] = [];

  mockUpsertProfile.mockImplementation(async (payload) => {
    calls.push(payload);
    const next = queue.shift();
    if (!next) {
      throw new Error("Missing upsert response");
    }
    if (next instanceof Error) {
      throw next;
    }
    return next;
  });

  return calls;
}

describe("ensureProfile action", () => {
  beforeEach(() => {
    mockRequireUser.mockReset();
    mockUpsertProfile.mockReset();
  });

  it("throws UnauthorizedError when the session is missing", async () => {
    mockRequireUser.mockRejectedValue(new UnauthorizedError());

    await expect(ensureProfile()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("propagates unexpected auth errors", async () => {
    const failure = new Error("oh no");
    mockRequireUser.mockRejectedValue(failure);

    await expect(ensureProfile()).rejects.toBe(failure);
  });

  it("throws when profile upsert fails with a non-duplicate error", async () => {
    const user: SupabaseUser = {
      id: "user-123",
      email: "user@example.com",
      user_metadata: null,
    };

    mockRequireUser.mockResolvedValue(user);
    queueUpsertResponses([buildUpsertError("123", "boom")]);

    await expect(ensureProfile()).rejects.toThrow(
      "ensureProfile upsert failed: userId=user-123 slug=user code=123 message=boom"
    );
  });

  it("prefers metadata values and retries slug conflicts until a unique slug is returned", async () => {
    const user: SupabaseUser = {
      id: "user-123",
      email: "user@example.com",
      user_metadata: {
        username: "Cool User",
        full_name: "  Example Name  ",
        avatar_url: "https://example.com/avatar.png",
      },
    };

    const upsertResponses: UpsertResponse[] = [
      buildUpsertError("23505", "Supabase error"),
      buildUpsertError("23505", "Supabase error"),
      { slug: "cool-user-2" },
    ];

    const upsertCalls = queueUpsertResponses(upsertResponses);
    mockRequireUser.mockResolvedValue(user);

    const slug = await ensureProfile();

    expect(slug).toBe("cool-user-2");
    expect(upsertCalls.map((call) => call.slug)).toEqual(["cool-user", "cool-user-1", "cool-user-2"]);
    expect(upsertCalls[0].displayName).toBe("Example Name");
    expect(upsertCalls[0].avatarUrl).toBe("https://example.com/avatar.png");
  });

  it("falls back to the email prefix for display name and slug base when metadata is missing", async () => {
    const user: SupabaseUser = {
      id: "user-456",
      email: "jane.doe@example.com",
      user_metadata: null,
    };

    const upsertResponses: UpsertResponse[] = [{ slug: "jane-doe" }];
    const upsertCalls = queueUpsertResponses(upsertResponses);
    mockRequireUser.mockResolvedValue(user);

    const slug = await ensureProfile();

    expect(slug).toBe("jane-doe");
    expect(upsertCalls).toHaveLength(1);
    expect(upsertCalls[0].displayName).toBe("jane.doe");
    expect(upsertCalls[0].avatarUrl).toBeNull();
  });

  it("throws when slug allocation exceeds the retry limit", async () => {
    const user: SupabaseUser = {
      id: "user-789",
      email: "retry@example.com",
      user_metadata: null,
    };

    const conflictResponses = Array.from({ length: 10 }, () => buildUpsertError("23505", "Supabase error"));
    const upsertCalls = queueUpsertResponses(conflictResponses);
    mockRequireUser.mockResolvedValue(user);

    await expect(ensureProfile()).rejects.toThrow(
      "ensureProfile failed to allocate a unique slug: userId=user-789"
    );
    expect(upsertCalls).toHaveLength(10);
  });
});
