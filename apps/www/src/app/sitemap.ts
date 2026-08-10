import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-08-10");
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://start.careerdirect.kr").replace(/\/$/, "");
  const officialUrl = (process.env.NEXT_PUBLIC_OFFICIAL_SITE_URL ?? "https://www.careerdirect.kr").replace(/\/$/, "");
  return [
    { url: officialUrl, lastModified, changeFrequency: "monthly", priority: 1 },
    ...["assessment", "consulting", "pricing", "organizations", "consultant"].map((path) => ({
      url: `${officialUrl}/${path}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
    { url: siteUrl, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/career-check`, lastModified, changeFrequency: "monthly", priority: 0.95 },
    { url: `${siteUrl}/assessment-consultation`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
