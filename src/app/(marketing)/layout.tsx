import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Footer } from "@/modules/marketing/layout/Footer";
import { Navbar } from "@/modules/marketing/layout/Navbar";
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

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SeoJsonLd />
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  );
}
