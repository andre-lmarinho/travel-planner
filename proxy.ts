import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { buildCsp } from "./securityHeaders";
import { clientEnv } from "./src/lib/env/clientEnv";

const isE2E = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_E2E === "1";

// It exists for the two jobs that cannot live anywhere else: refreshing the
// Supabase session cookie on navigation (a Server Component cannot write
// cookies) and emitting a per-request CSP nonce. Route guards and redirects
// stay in page.tsx; write authorization stays in the database.
export async function proxy(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";
  const nonce = crypto.randomUUID();
  const csp = buildCsp({ isDev, nonce });

  // The nonce must be on the *request* CSP header: that is where Next reads it
  // from to stamp its own script tags, so the strict production policy actually
  // admits the RSC bootstrap instead of blocking hydration.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", csp);

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);

  // E2E runs against a mocked Supabase; server components own auth there.
  if (isE2E) {
    return response;
  }

  const supabase = createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write the refreshed session back to the browser here. A Server
          // Component cannot set cookies, so without this the rotated refresh
          // token is lost and idle sessions get dropped mid-navigation.
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          requestHeaders.set("cookie", request.cookies.toString());
          response = NextResponse.next({ request: { headers: requestHeaders } });
          response.headers.set("Content-Security-Policy", csp);
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Refreshes an expiring access token and flushes new cookies via setAll.
  // A transient auth-service failure must not 500 every page: page-level guards
  // still enforce access, the session just isn't refreshed on this pass.
  try {
    await supabase.auth.getClaims();
  } catch {
    // ignore
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.[^/]+$).*)"],
};
