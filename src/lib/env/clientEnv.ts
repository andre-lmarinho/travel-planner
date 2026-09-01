import { z } from "zod";

const clientEnvSchema = z.object({
  NODE_ENV: z.string().default("development"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
});

// Next.js replaces `process.env.NEXT_PUBLIC_*` at build time, but the
// `process.env` object itself is empty in the browser. Referencing each key
// explicitly ensures the values are inlined during compilation and available at runtime.
// In CI we allow safe public placeholders so builds don't fail when secrets are absent.
// Production must always provide its real browser configuration.
const CI_TRUTHY_VALUES = new Set(["true", "1", "yes"]);

const isTruthyCi = (value: unknown) => {
  if (typeof value !== "string") return false;

  const normalizedValue = value.trim().toLowerCase();
  return normalizedValue.length > 0 && CI_TRUTHY_VALUES.has(normalizedValue);
};

const IN_CI = isTruthyCi(process.env.CI);

const FALLBACKS = {
  NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
} as const;

const withCiFallback = (value: string | undefined, fallback: string) =>
  value ?? (IN_CI ? fallback : undefined);

export const clientEnv = clientEnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SUPABASE_URL: withCiFallback(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    FALLBACKS.NEXT_PUBLIC_SUPABASE_URL
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: withCiFallback(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    FALLBACKS.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ),
});
