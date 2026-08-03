import type { Metadata } from "next";
import { ensureProfile } from "@/features/auth/lib/ensureProfile";
import { resolveNextPath } from "@/features/auth/lib/redirect";
import { redirectIfAuthenticated } from "@/features/auth/lib/redirectServer";
import { LoginView } from "@/modules/auth/login-view";

export const metadata: Metadata = {
  title: "Log in | Turistar",
};

export default async function LoginRoute({ searchParams }: { searchParams?: Promise<{ next?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const nextPath = resolveNextPath(resolvedSearchParams?.next);

  await redirectIfAuthenticated(nextPath);

  async function resolveProfileAction() {
    "use server";
    return ensureProfile();
  }

  return <LoginView resolveProfile={resolveProfileAction} nextPath={nextPath} />;
}
