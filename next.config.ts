import type { NextConfig } from "next";

function optionalOrigin(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try { return new URL(value).origin; } catch { return undefined; }
}

export function createSecurityHeaders(production: boolean): { key: string; value: string }[] {
  const supabaseOrigin = optionalOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const connectSources = ["'self'", ...(supabaseOrigin ? [supabaseOrigin, supabaseOrigin.replace("https://", "wss://")] : [])];
  const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSources.join(" ")}`,
    "manifest-src 'self'",
    "media-src 'self'",
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
  const headers = [
    { key: "Content-Security-Policy", value: contentSecurityPolicy },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), interest-cohort=()" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  ];
  if (production) headers.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" });
  return headers;
}

const production = process.env.NODE_ENV === "production";
const noStore = [{ key: "Cache-Control", value: "private, no-store, max-age=0" }];
const nextConfig: NextConfig = {
  async headers() {
    if (!production) return [];
    return [
      { source: "/:path*", headers: createSecurityHeaders(true) },
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }, { key: "Service-Worker-Allowed", value: "/" }] },
      { source: "/icons/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/favicon.svg", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/dashboard/:path*", headers: noStore },
      { source: "/auth/:path*", headers: noStore },
      { source: "/api/:path*", headers: noStore },
    ];
  },
};

export default nextConfig;
