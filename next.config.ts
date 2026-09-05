import type { NextConfig } from "next";
import { getBuildInfo } from "./lib/build-info";

const build = getBuildInfo();

const securityHeaders = [
  { key: "Content-Security-Policy", value: "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: build.version,
    NEXT_PUBLIC_BUILD_SOURCE: build.source,
    NEXT_PUBLIC_BUILD_COMMIT: build.commit,
    NEXT_PUBLIC_BUILD_ENV: process.env.VERCEL_ENV || (process.env.NODE_ENV === "production" ? "production" : "local"),
  },
  typescript: { ignoreBuildErrors: true },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
