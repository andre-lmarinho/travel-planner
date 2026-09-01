// Canonical public origin for absolute URLs and SEO metadata.
import { getPublicSiteUrl } from "@/lib/urls/url";

const PRODUCTION_SITE_URL = "https://turistar.me";

export const SITE_URL = process.env.NODE_ENV === "production" ? PRODUCTION_SITE_URL : getPublicSiteUrl();
