export function resolveNextPath(next: unknown): string | null {
  if (typeof next !== "string") return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export function buildSignupHref(nextPath: string | null): string {
  return nextPath ? `/?next=${encodeURIComponent(nextPath)}` : "/";
}

export function buildLoginHref(nextPath: string | null): string {
  return nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";
}

export function buildEmailRedirectUrl(nextPath: string | null, origin: string): string | undefined {
  if (!nextPath) return undefined;
  try {
    return new URL(nextPath, origin).toString();
  } catch {
    return undefined;
  }
}

export function buildResetPasswordRedirectUrl(nextPath: string | null, origin: string): string | undefined {
  try {
    const url = new URL("/forgot-password/reset", origin);
    if (nextPath) {
      url.searchParams.set("next", nextPath);
    }
    return url.toString();
  } catch {
    return undefined;
  }
}
