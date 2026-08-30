import { describe, expect, it } from "vitest";
import { buildCsp, getSecurityHeaders } from "../../../securityHeaders";

describe("security headers", () => {
  it("includes core hardening headers", () => {
    const headers = getSecurityHeaders(false);
    const keys = new Set(headers.map((h) => h.key));
    expect(keys.has("Strict-Transport-Security")).toBe(true);
    expect(keys.has("X-Content-Type-Options")).toBe(true);
    expect(keys.has("X-Frame-Options")).toBe(true);
    expect(keys.has("Referrer-Policy")).toBe(true);
    expect(keys.has("Permissions-Policy")).toBe(true);
  });

  it("omits CSP (the proxy sets it with a per-request nonce)", () => {
    const keys = new Set(getSecurityHeaders(false).map((h) => h.key));
    expect(keys.has("Content-Security-Policy")).toBe(false);
  });

  it("omits HSTS in development", () => {
    const keys = new Set(getSecurityHeaders(true).map((h) => h.key));
    expect(keys.has("Strict-Transport-Security")).toBe(false);
  });

  it("uses a conservative, widely supported Permissions-Policy set", () => {
    const pp = getSecurityHeaders(false).find((h) => h.key === "Permissions-Policy")?.value ?? "";
    expect(pp).toContain("camera=()");
    expect(pp).toContain("microphone=()");
    expect(pp).toContain("geolocation=()");
    expect(pp).toContain("payment=()");
    expect(pp).toContain("fullscreen=(self)");
    // Avoid deprecated/unrecognized features to prevent console warnings
    expect(pp).not.toContain("ambient-light-sensor");
    expect(pp).not.toContain("battery");
    expect(pp).not.toContain("document-domain");
  });

  it("allows only the external origins used by the browser", () => {
    const csp = buildCsp({ isDev: false, nonce: "test" });
    expect(csp).toContain("img-src 'self' data: blob: https://i.pravatar.cc");
    expect(csp).not.toContain("geoapify.com");
    expect(csp).toContain("frame-src https://vercel.live https://www.youtube-nocookie.com");
    expect(csp).toContain("connect-src 'self' https://*.supabase.co wss://*.supabase.co");
    const imageSrc = csp.split("; ").find((directive) => directive.startsWith("img-src")) ?? "";
    expect(imageSrc.split(" ")).not.toContain("https:");
  });
});
