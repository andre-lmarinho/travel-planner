"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/shared/lib/supabaseClient";
import { formatSupabaseError } from "@/shared/lib/supabaseErrors";
import { Logo } from "@/shared/ui/logo/Logo";
import { DesktopActions } from "./components/DesktopActions";
import { DesktopNavigation } from "./components/DesktopNavigation";
import { MenuToggleButton } from "./components/MenuToggleButton";
import { MobileMenu } from "./components/MobileMenu";

type Profile = { slug: string | null };

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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
            operation: "Navbar.loadProfile:selectProfile",
            identifiers: { userId },
            error,
          })
        );
        if (active) setProfile(null);
        return;
      }

      if (active) setProfile({ slug: data?.slug ?? null });
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

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const element = shellRef.current;
    if (!element) return;

    const updateElevation = () => {
      const scrollY = window.scrollY ?? document.documentElement.scrollTop ?? document.body.scrollTop ?? 0;
      element.setAttribute("data-elevated", scrollY > 0 ? "true" : "false");
    };

    updateElevation();
    window.addEventListener("scroll", updateElevation, { passive: true });
    return () => window.removeEventListener("scroll", updateElevation);
  }, []);

  const plannerHref = profile?.slug ? `/u/${profile.slug}` : null;

  return (
    <header className="bg-background fixed top-0 z-50 my-0 w-full py-2 lg:my-2 lg:mb-0 lg:bg-transparent lg:px-6 lg:py-0">
      <div
        ref={shellRef}
        data-elevated="false"
        className="data-[elevated=true]:bg-background data-[elevated=true]:lg:border-border mx-auto max-w-6xl rounded-2xl border border-transparent bg-transparent px-2 transition-[background-color,border-color] duration-300 ease-out data-[elevated=true]:lg:border lg:px-8">
        <div className="flex items-center justify-between gap-3 md:gap-8 lg:grid lg:grid-cols-[1fr_auto]">
          <div className="flex items-center gap-2 lg:gap-4">
            <Logo href="/" />
            <DesktopNavigation />
          </div>
          <DesktopActions plannerHref={plannerHref} />
          <MenuToggleButton
            isOpen={isMobileMenuOpen}
            onToggle={() => setIsMobileMenuOpen((current) => !current)}
          />
        </div>
      </div>

      {isMobileMenuOpen ? <MobileMenu plannerHref={plannerHref} onClose={closeMobileMenu} /> : null}
    </header>
  );
}
