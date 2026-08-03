import type { Metadata } from "next";
import { ensureProfile } from "@/features/auth/lib/ensureProfile";
import { resolveNextPath } from "@/features/auth/lib/redirect";
import { redirectIfAuthenticated } from "@/features/auth/lib/redirectServer";
import { SignupView } from "@/modules/auth/signup-view";

export const metadata: Metadata = {
  title: "Sign up | Turistar",
};

export default async function SignupRoute({ searchParams }: { searchParams?: Promise<{ next?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const nextPath = resolveNextPath(resolvedSearchParams?.next);

  await redirectIfAuthenticated(nextPath);

  async function finalizeProfileAction() {
    "use server";
    return ensureProfile();
  }

  return <SignupView finalizeProfile={finalizeProfileAction} nextPath={nextPath} />;
}
