// app/robots.ts

import type { MetadataRoute } from "next";

import { siteConfig } from "@/app/libs/seo";

const privateRoutes = [
  "/api/",
  "/admin/",
  "/manager/",
  "/account/",
  "/conversations/",
  "/favorites/",

  // Localized routes
  "/*/admin/",
  "/*/manager/",
  "/*/account/",
  "/*/conversations/",
  "/*/favorites/",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Google, Bing and other search engines
        userAgent: "*",
        allow: "/",
        disallow: privateRoutes,
      },
      {
        // ChatGPT Search
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: privateRoutes,
      },
      {
        // Google Extended (AI)
        userAgent: "Google-Extended",
        allow: "/",
        disallow: privateRoutes,
      },
      {
        // Claude
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: privateRoutes,
      },
    ],

    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
} 