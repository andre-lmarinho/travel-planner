import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import { getSecurityHeaders } from "./securityHeaders";

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

const nextConfig: NextConfig = {
  // Strengthen defaults for production readiness
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "commons.wikimedia.org", pathname: "/wiki/Special:FilePath/**" },
      { protocol: "https", hostname: "upload.wikimedia.org", pathname: "/wikipedia/**" },
    ],
  },
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    // CSP is not here: the proxy sets it with a per-request nonce.
    return [
      {
        source: "/:path*",
        headers: getSecurityHeaders(isDev),
      },
    ];
  },
};

export default withMDX(nextConfig);
