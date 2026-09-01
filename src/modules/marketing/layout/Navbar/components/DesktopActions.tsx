"use client";

import { useEffect, useState } from "react";
import { formatSupabaseError } from "@/lib/errors";
import { Button } from "@/shared/ui/button";
import { supabase } from "@/supabase/client";

type Profile = { slug: string | null };

export function DesktopActions() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile(userId: string | null | undefined) {
      if (!userId) {
        if (active) setProfile(null);
        return;
      }

      const { data, error } = await supabase.from("profiles").select("slug").eq("id", userId).maybeSingle();
      if (error) {
        console.error(
          formatSupabaseError({
            operation: "DesktopActions.loadProfile:selectProfile",
            identifiers: { userId },
            error,
          })
        );
        if (active) setProfile(null);
        return;
      }

      const slug =
        data && typeof data === "object" && "slug" in data && typeof data.slug === "string"
          ? data.slug
          : null;

      if (active) setProfile({ slug });
    }

    void supabase.auth.getSession().then(({ data }) => loadProfile(data.session?.user?.id));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadProfile(session?.user?.id);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

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
