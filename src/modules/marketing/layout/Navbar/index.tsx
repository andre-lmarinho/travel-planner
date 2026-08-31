"use client";

import { useEffect, useRef } from "react";
import { Logo } from "@/shared/ui/logo";
import { DesktopActions } from "./components/DesktopActions";

export function Navbar() {
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;

    const getScrollY = () =>
      window.scrollY ?? document.documentElement.scrollTop ?? document.body.scrollTop ?? 0;
    const set = () => el.setAttribute("data-elevated", getScrollY() > 0 ? "true" : "false");

    set();
    window.addEventListener("scroll", set, { passive: true });
    return () => window.removeEventListener("scroll", set);
  }, []);

  return (
    <header className="bg-background fixed top-0 z-50 my-0 w-full py-2 lg:my-2 lg:mb-0 lg:bg-transparent lg:px-6 lg:py-0">
      <div
        ref={shellRef}
        data-elevated="false"
        className="data-[elevated=true]:bg-background data-[elevated=true]:lg:border-border mx-auto max-w-6xl rounded-2xl border border-transparent bg-transparent px-2 transition-[background-color,border-color] duration-300 ease-out data-[elevated=true]:lg:border lg:px-8">
        <div className="flex items-center justify-between gap-3 lg:py-2">
          <Logo href="/" />
          <DesktopActions />
        </div>
      </div>
    </header>
  );
}
