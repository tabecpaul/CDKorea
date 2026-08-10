import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/official/", "/career-check/thank-you", "/callback-schedule/", "/admin/", "/api/"] },
    sitemap: "https://www.careerdirect.kr/sitemap.xml",
  };
}
