"use client";

import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { isDemoUser } from "@/features/demo/lib/demo";
import { createSupabaseBrowserClient } from "@/supabase/client";

const PROJECT_TOKEN = process.env.NEXT_PUBLIC_POSTHUG_PROJECT_TOKEN;
const API_HOST = process.env.NEXT_PUBLIC_POSTHUG_HOST ?? "https://us.i.posthog.com";

type PageGroup = "auth_home" | "planner";

function getPageGroup(pathname: string): PageGroup | null {
  if (pathname === "/" || pathname === "/login" || pathname.startsWith("/forgot-password"))
    return "auth_home";
  if (pathname.startsWith("/u/") || pathname.startsWith("/p/")) return "planner";
  return null;
}

function isAnalyticsDisabled(): boolean {
  return window.localStorage.getItem("turistar.analytics.disabled") === "1";
}

function PageAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!PROJECT_TOKEN || isAnalyticsDisabled()) return;
    const pageGroup = getPageGroup(pathname);
    if (!pageGroup) return;

    const startedAt = Date.now();
    let reported = false;
    posthog.capture("$pageview", { page_group: pageGroup });

    const reportDuration = () => {
      if (reported) return;
      reported = true;
      posthog.capture("page_duration", {
        page_group: pageGroup,
        duration_seconds: Math.max(0, Math.round((Date.now() - startedAt) / 1000)),
      });
    };

    window.addEventListener("pagehide", reportDuration);
    return () => {
      reportDuration();
      window.removeEventListener("pagehide", reportDuration);
    };
  }, [pathname]);

  return null;
}

function AccountAnalytics() {
  useEffect(() => {
    if (!PROJECT_TOKEN || isAnalyticsDisabled()) return;
    const supabase = createSupabaseBrowserClient();

    const syncAccount = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        posthog.reset();
        return;
      }
      posthog.identify(user.id, { is_demo: isDemoUser(user.email) });
    };

    void syncAccount();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => void syncAccount());
    return () => subscription.unsubscribe();
  }, []);

  return null;
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!PROJECT_TOKEN || isAnalyticsDisabled()) return;
    posthog.init(PROJECT_TOKEN, {
      api_host: API_HOST,
      capture_pageview: false,
      capture_pageleave: false,
      autocapture: false,
      disable_session_recording: true,
    });
  }, []);

  return (
    <>
      {children}
      <PageAnalytics />
      <AccountAnalytics />
    </>
  );
}

export function disableAnalytics(): void {
  window.localStorage.setItem("turistar.analytics.disabled", "1");
  posthog.opt_out_capturing();
}
