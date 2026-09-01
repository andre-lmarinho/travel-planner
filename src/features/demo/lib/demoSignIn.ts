import { signInWithPassword } from "@/features/auth/handlers/signInWithPassword";
import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_SLUG } from "@/features/demo/lib/demo";

// Signs into the shared demo account and redirects to its dashboard. The demo
// profile always exists, so the resolveProfile fallback (used only when no slug is
// returned) just resolves to the known demo slug rather than creating anything.
export async function demoSignIn(resolveProfile: () => Promise<string>): Promise<string> {
  const { slug } = await signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    resolveProfile: resolveProfile ?? (async () => DEMO_SLUG),
  });
  return slug;
}
