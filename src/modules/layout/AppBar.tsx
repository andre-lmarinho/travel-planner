import { getViewer } from "@/features/auth/lib/session";
import { ProfileRepository } from "@/features/profile/repositories/ProfileRepository";
import { createSupabaseServerClient } from "@/supabase/server";
import { Button } from "@/ui/components/button";
import { Logo } from "@/ui/components/logo";

import { AvatarMenu } from "./AvatarMenu";

type UserProfile = {
  slug: string | null;
  displayName: string | null;
  email: string | null;
};

async function getUserProfile(): Promise<UserProfile> {
  try {
    const viewer = await getViewer();
    if (!viewer) return { slug: null, displayName: null, email: null };

    const profile = await new ProfileRepository(createSupabaseServerClient()).fetchProfileByUserId(viewer.id);
    return {
      slug: profile?.slug ?? null,
      displayName: profile?.displayName ?? null,
      email: viewer.email ?? null,
    };
  } catch {
    return { slug: null, displayName: null, email: null };
  }
}

export async function AppBar() {
  const { slug, displayName, email } = await getUserProfile();
  const isLoggedIn = Boolean(email);

  return (
    <header className="border-border bg-background text-foreground sticky top-0 z-40 shrink-0 border-b">
      <nav className="flex min-h-16 w-full items-center justify-between gap-4 px-3 md:px-6 xl:px-8">
        <Logo href={slug ? `/u/${slug}` : "/login"} />
        {isLoggedIn ? (
          <AvatarMenu displayName={displayName} email={email} slug={slug} />
        ) : (
          <div className="flex items-center gap-1.5">
            <Button href="/login" variant="ghost" className="min-h-11 px-3">
              Log in
            </Button>
            <Button href="/" className="min-h-11 rounded-xl px-4 shadow-sm">
              Get started
            </Button>
          </div>
        )}
      </nav>
    </header>
  );
}
