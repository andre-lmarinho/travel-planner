import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Footer } from "@/modules/marketing/layout/Footer";
import { LegalArticle } from "@/modules/marketing/layout/LegalArticle";
import { Navbar } from "@/modules/marketing/layout/Navbar";

import { SITE_URL } from "@/shared/utils/siteUrl";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Legal Documents · Turistar",
    template: "%s · Turistar",
  },
  description:
    "Full transparency about how Turistar protects your data and the agreements that govern the product experience.",
  applicationName: "Turistar",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <LegalArticle>{children}</LegalArticle>
      </main>
      <Footer />
    </>
  );
}
