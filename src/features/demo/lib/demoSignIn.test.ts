import { beforeEach, describe, expect, it, vi } from "vitest";

import { signInWithPassword } from "@/features/auth/handlers/signInWithPassword";
import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_SLUG } from "@/features/demo/lib/demo";

import { demoSignIn } from "./demoSignIn";

vi.mock("@/features/auth/handlers/signInWithPassword", () => ({
  signInWithPassword: vi.fn(),
}));

const mockedSignIn = vi.mocked(signInWithPassword);

beforeEach(() => {
  mockedSignIn.mockReset();
});

describe("demoSignIn", () => {
  it("signs in with the shared demo credentials and returns the slug", async () => {
    mockedSignIn.mockResolvedValue({ slug: DEMO_SLUG });

    const slug = await demoSignIn(async () => "some-other-slug");

    expect(mockedSignIn).toHaveBeenCalledWith({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      resolveProfile: expect.any(Function),
    });
    expect(slug).toBe(DEMO_SLUG);
  });

  it("falls back to the demo slug when no resolveProfile is given", async () => {
    mockedSignIn.mockResolvedValue({ slug: DEMO_SLUG });

    const slug = await demoSignIn(undefined as never);

    expect(mockedSignIn).toHaveBeenCalledTimes(1);
    const { resolveProfile } = mockedSignIn.mock.calls[0][0];
    await expect(resolveProfile()).resolves.toBe(DEMO_SLUG);
    expect(slug).toBe(DEMO_SLUG);
  });
});
