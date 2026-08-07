import type { MetadataRoute } from "next";

import { siteConfig } from "@/app/libs/seo";
import prisma from "@/app/libs/prismadb";
export const dynamic = "force-dynamic";

const siteUrl = siteConfig.url;

const locales = ["ar", "en", "de"] as const;

type Locale = (typeof locales)[number];

const staticPaths = [
  "/about",
  "/privacy",
  "/terms",
  "/safety",
  "/report",
  "/contact",
] as const;

const buildLocalizedUrl = (locale: Locale, path: string) => {
  return `${siteUrl}/${locale}${path}`;
};

const buildLanguageAlternates = (path: string) => {
  return {
    ar: buildLocalizedUrl("ar", path),
    en: buildLocalizedUrl("en", path),
    de: buildLocalizedUrl("de", path),
    "x-default": buildLocalizedUrl("ar", path),
  };
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await prisma.listing.findMany({
    where: {
      isActive: true,
      user: {
        is: {
          isBanned: false,
        },
      },
    },

    select: {
      id: true,
      updatedAt: true,
    },

    orderBy: {
      updatedAt: "desc",
    },

    take: 5000,
  });

  const now = new Date();

  const homeRoutes: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: buildLocalizedUrl(locale, ""),
    lastModified: now,
    changeFrequency: "daily",
    priority: 1,

    alternates: {
      languages: buildLanguageAlternates(""),
    },
  }));

  const searchRoutes: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: buildLocalizedUrl(locale, "/search"),
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.9,

    alternates: {
      languages: buildLanguageAlternates("/search"),
    },
  }));

  const staticRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    staticPaths.map((path) => ({
      url: buildLocalizedUrl(locale, path),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: path === "/about" ? 0.7 : 0.5,

      alternates: {
        languages: buildLanguageAlternates(path),
      },
    }))
  );

  const listingRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    listings.map((listing) => {
      const path = `/listings/${listing.id}`;

      return {
        url: buildLocalizedUrl(locale, path),
        lastModified: listing.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,

        alternates: {
          languages: buildLanguageAlternates(path),
        },
      };
    })
  );

  return [
    ...homeRoutes,
    ...searchRoutes,
    ...staticRoutes,
    ...listingRoutes,
  ];
}