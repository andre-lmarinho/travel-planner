/**
 * Resolve the public site origin in a safe and predictable way.
 *
 * Priority:
 * 1) Browser runtime: window.location.origin
 * 2) Explicit env: NEXT_PUBLIC_SITE_URL (or SITE_URL) – must be full URL
 * 3) Vercel env: VERCEL_URL / NEXT_PUBLIC_VERCEL_URL (domain only) → https://<domain>
 * 4) Fallback: http://localhost:<PORT | 3000>
 *
 * Notes:
 * - Do not include a trailing slash in the returned origin.
 * - Prefer leaving NEXT_PUBLIC_SITE_URL unset in local dev.
 */
export function getPublicSiteUrl(): string {
  // 1) Browser runtime
  if (typeof window !== "undefined" && typeof window.location?.origin === "string") {
    return stripTrailingSlash(window.location.origin);
  }

  // 2) Explicit env override
  const explicit = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  if (explicit && /^https?:\/\//i.test(explicit)) {
    return stripTrailingSlash(explicit);
  }

  // 3) Vercel-provided deployment URL (domain without scheme)
  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL;
  if (vercel && vercel.length > 0) {
    const withScheme = vercel.startsWith("http") ? vercel : `https://${vercel}`;
    return stripTrailingSlash(withScheme);
  }

  // 4) Fallback: local dev
  const port = process.env.PORT ?? "3000";
  return `http://localhost:${port}`;
}

function stripTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

// Default export removed to prefer named imports.
