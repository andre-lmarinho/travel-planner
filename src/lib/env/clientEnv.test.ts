import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

describe("clientEnv", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
  });

  it.each(["1", "true", "yes"])("uses fallback values when CI=%s via truthy string", async (ciValue) => {
    process.env.CI = ciValue;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { clientEnv } = await import("./clientEnv");

    expect(clientEnv.NEXT_PUBLIC_SUPABASE_URL).toBe("http://localhost:54321");
    expect(clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("anon");
  });
});
