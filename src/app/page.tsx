import type { Metadata } from "next";
import { ensureProfile } from "@/features/auth/lib/ensureProfile";
import { resolveNextPath } from "@/features/auth/lib/redirect";
import { redirectIfAuthenticated } from "@/features/auth/lib/redirectServer";
import { SignupView } from "@/modules/auth/signup-view";
import SeoJsonLd from "@/modules/marketing/seo/SeoJsonLd";
import { SITE_URL } from "@/shared/utils/siteUrl";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Plan trips together, all in one place",
    template: "%s · Turistar",
  },
  description:
    "Build a day-by-day itinerary, see every stop on the map, and track the budget with your travel companions.",
  applicationName: "Turistar",
  keywords: ["travel planner", "trip planner", "itinerary", "budget travel", "map", "vacation planner"],
  category: "travel",
  authors: [{ name: "Turistar" }],
  creator: "Turistar",
  publisher: "Turistar",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Turistar",
    title: "Turistar · Plan trips together",
    description:
      "Build a day-by-day itinerary, see every stop on the map, and track the budget with your travel companions.",
  },
  twitter: {
    card: "summary",
    title: "Turistar · Plan trips together",
    description:
      "Build a day-by-day itinerary, see every stop on the map, and track the budget with your travel companions.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function SignupRoute({ searchParams }: { searchParams?: Promise<{ next?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const nextPath = resolveNextPath(resolvedSearchParams?.next);

  await redirectIfAuthenticated(nextPath);

  async function finalizeProfileAction() {
    "use server";
    return ensureProfile();
  }

  return (
    <>
      <SeoJsonLd />
      <SignupView finalizeProfile={finalizeProfileAction} nextPath={nextPath} />
    </>
  );
}
