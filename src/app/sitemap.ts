import type { MetadataRoute } from "next";

import { SITE_URL } from "@/shared/utils/siteUrl";

const MARKETING_ROUTES = ["/", "/privacy", "/terms"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return MARKETING_ROUTES.map((route) => ({
    url: SITE_URL + route,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
