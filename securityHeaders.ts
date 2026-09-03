// Centralized security headers applied by Next.js via next.config.ts.
// We keep a strict CSP in production and relax it in development to support Next.js Dev/HMR.

export type Header = { key: string; value: string };

// The proxy always supplies a per-request nonce, so production emits a strict
// nonce-based CSP. Only local dev relaxes it for HMR (inline scripts + eval +
// websockets). Preview intentionally uses the production posture.
export function buildCsp({ isDev, nonce }: { isDev: boolean; nonce: string }): string {
  const common = [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    // upload.wikimedia.org: commons Special:FilePath 302-redirects there, and CSP
    // checks redirect targets. images.unsplash.com: DEFAULT_PLAN_COVER_IMAGE.
    "img-src 'self' data: blob: https://i.pravatar.cc https://commons.wikimedia.org https://upload.wikimedia.org https://images.unsplash.com",
    "font-src 'self' data:",
    "frame-src https://vercel.live https://www.youtube-nocookie.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ];

  if (isDev) {
    common.push(
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: http: https:",
      // Do not emit script-src-elem in dev to avoid browser quirks with inline scripts
      "connect-src http: https: ws: wss:",
      "worker-src blob: data: http: https:"
    );
  } else {
    common.push(
      `script-src 'self' 'strict-dynamic' 'nonce-${nonce}'`,
      `script-src-elem 'self' 'nonce-${nonce}'`,
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://us.i.posthog.com",
      "worker-src 'self'"
    );
  }

  return common.join("; ");
}

function buildPermissionsPolicy(): string {
  // Use a conservative, broadly-supported subset to avoid browser warnings.
  // Deny by default unless explicitly needed by the app.
  return ["camera=()", "microphone=()", "geolocation=()", "payment=()", "fullscreen=(self)"].join(", ");
}

// Static headers applied to every response via next.config.ts. The CSP is not
// here: it carries a per-request nonce and is set by the proxy instead.
export function getSecurityHeaders(isDev: boolean): Header[] {
  const headers: Header[] = [
    // Disable MIME type sniffing
    { key: "X-Content-Type-Options", value: "nosniff" },
    // Clickjacking protection
    { key: "X-Frame-Options", value: "DENY" },
    // More privacy-preserving referrers
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // Basic permission policy (tighten as features are added)
    { key: "Permissions-Policy", value: buildPermissionsPolicy() },
  ];
  if (!isDev) {
    headers.unshift({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }
  return headers;
}
