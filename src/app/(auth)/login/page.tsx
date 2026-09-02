import type { Metadata } from "next";
import { resolveNextPath } from "@/features/auth/lib/redirect";
import { redirectIfAuthenticated } from "@/features/auth/lib/redirectServer";
import { getViewer } from "@/features/auth/lib/session";
import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";
import { ProfileService } from "@/features/profile/services/ProfileService";
import { ApplicationError } from "@/lib/errors";
import { LoginView } from "@/modules/auth/login-view";
import { createSupabaseServerClient } from "@/supabase/server";

export const metadata: Metadata = {
  title: "Login | Turistar App",
};

export default async function LoginRoute({ searchParams }: { searchParams?: Promise<{ next?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const nextPath = resolveNextPath(resolvedSearchParams?.next);

  await redirectIfAuthenticated(nextPath);

  async function resolveProfileAction() {
    "use server";
    const viewer = await getViewer();
    if (!viewer) throw new ApplicationError("UNAUTHORIZED", "Sign in to create a profile.");
    return new ProfileService(new ProfileRepository(createSupabaseServerClient())).ensureProfile(viewer);
  }

  return <LoginView resolveProfile={resolveProfileAction} nextPath={nextPath} />;
}
