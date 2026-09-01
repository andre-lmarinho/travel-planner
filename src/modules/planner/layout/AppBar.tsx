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
    const supabase = createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    const typedUser = authData.user as { id?: string; email?: string | null } | null;
    const userId = typedUser?.id ?? null;
    const email = typedUser?.email ?? null;

    if (!userId) {
      return { slug: null, displayName: null, email: null };
    }

    const profile = await new ProfileRepository(supabase).fetchProfileByUserId(userId);

    return {
      slug: profile?.slug ?? null,
      displayName: profile?.displayName ?? null,
      email: email ?? null,
    };
  } catch {
    return { slug: null, displayName: null, email: null };
  }
}

export async function AppBar() {
  const { slug, displayName, email } = await getUserProfile();
  const targetHref = slug ? `/u/${slug}` : "/login";
  const isLoggedIn = Boolean(email);

  return (
    <header className="text-foreground border-border bg-background sticky top-0 z-40 shrink-0 border-b">
      <nav className="mx-auto flex h-full w-full items-center justify-between p-1">
        <Logo href={targetHref} />

        {isLoggedIn ? (
          <AvatarMenu displayName={displayName} email={email} />
        ) : (
          <div className="flex flex-row items-center justify-start gap-3 px-2">
            <Button href="/login" variant="ghost">
              Log in
            </Button>
            <Button href="/">Get started</Button>
          </div>
        )}
      </nav>
    </header>
  );
}
