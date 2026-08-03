import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Footer } from "@/modules/marketing/layout/Footer";
import { Navbar } from "@/modules/marketing/layout/Navbar";
import SeoJsonLd from "@/modules/marketing/seo/SeoJsonLd";

import { SITE_URL } from "@/shared/utils/siteUrl";

export const dynamic = "force-dynamic";

const siteDescription =
  "Build a day-by-day itinerary, map every stop, track your budget, and plan with friends in one free, open-source travel planner.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Turistar — Travel planner for itineraries, maps and budgets",
    template: "%s · Turistar",
  },
  description: siteDescription,
  applicationName: "Turistar",
  keywords: ["travel planner", "trip planner", "itinerary", "budget travel", "map", "vacation planner"],
  category: "travel",
  authors: [{ name: "André Marinho", url: "https://andremarinho.me" }],
  creator: "André Marinho",
  publisher: "Turistar",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Turistar",
    title: "Turistar — Plan the whole trip in one place",
    description: siteDescription,
  },
  twitter: {
    card: "summary",
    title: "Turistar — Plan the whole trip in one place",
    description: siteDescription,
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
