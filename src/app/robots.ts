import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Admin, auth, and the Sanity Studio are never publicly indexable —
        // they require a session and carry no public/SEO value.
        disallow: ["/admin", "/admin/", "/login", "/sign-up", "/forgot-password", "/reset-password", "/studio", "/unauthorized"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
