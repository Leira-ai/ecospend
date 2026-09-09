import type { MetadataRoute } from "next";

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/", "/privacy", "/terms", "/methodology"], disallow: ["/dashboard/", "/auth/", "/api/", "/login", "/register", "/forgot-password", "/reset-password"] },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
