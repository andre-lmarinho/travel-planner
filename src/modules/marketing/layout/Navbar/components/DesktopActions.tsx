"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import { trpc } from "@/trpc/react";
import { Button } from "@/ui/components/button";

type Profile = { slug: string | null };

export function DesktopActions() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const profileUtils = trpc.useUtils();

  useEffect(() => {
    let active = true;

    async function loadProfile(userId: string | null | undefined) {
      if (!userId) {
        if (active) setProfile(null);
        return;
      }

      try {
        const profile = await profileUtils.viewer.profile.get.fetch({});
        if (active) setProfile({ slug: profile.slug });
      } catch {
        if (active) setProfile(null);
      }
    }

    void supabase.auth
      .getSession()
      .then(({ data }) => loadProfile(data.session?.user?.id))
      .catch(() => {
        if (active) setProfile(null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadProfile(session?.user?.id);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [profileUtils]);

  const destination = profile?.slug ? `/u/${profile.slug}` : null;

  return (
    <div className="ml-auto flex items-center gap-6 lg:ml-0 lg:justify-self-end">
      {destination ? (
        <Button href={destination} variant="accent">
          Go to Planner
        </Button>
      ) : (
        <>
          <Button href="/login" variant="ghost">
            Log in
          </Button>
          <Button href="/">Get started</Button>
        </>
      )}
    </div>
  );
}
