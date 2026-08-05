// app/libs/seo.ts

export type SiteLocale = "ar" | "en" | "de";

const configuredSiteUrl = process.env.NEXT_PUBLIC_APP_URL;

if (process.env.NODE_ENV === "production" && !configuredSiteUrl) {
  throw new Error("NEXT_PUBLIC_APP_URL is required in production.");
}

const siteUrl = (configuredSiteUrl || "http://localhost:3000").replace(
  /\/+$/,
  ""
);

export const siteConfig = {
  name: "VIA7",

  url: siteUrl,

  defaultLocale: "ar" as SiteLocale,

  locales: ["ar", "en", "de"] as const,

  titles: {
    ar: "VIA7 | سوق العقارات في سوريا",
    en: "VIA7 | Real Estate Marketplace in Syria",
    de: "VIA7 | Immobilienmarktplatz in Syrien",
  },

  descriptions: {
    ar: "VIA7 هو سوق عقارات حديث للإيجار والبيع واكتشاف العقارات في جميع أنحاء سوريا.",
    en: "VIA7 is a modern real estate marketplace for renting, buying, and discovering properties across Syria.",
    de: "VIA7 ist ein moderner Immobilienmarktplatz zum Mieten, Kaufen und Entdecken von Immobilien in ganz Syrien.",
  },

  keywords: [
    "VIA7",
    "Syria real estate",
    "Real estate Syria",
    "Property Syria",
    "Rent Syria",
    "Buy property Syria",
    "عقارات سوريا",
    "بيع عقارات سوريا",
    "إيجار عقارات سوريا",
    "شقق سوريا",
    "فلل سوريا",
    "Immobilien Syrien",
    "Wohnung Syrien",
    "Haus Syrien",
    "Damascus real estate",
    "Aleppo real estate",
    "Homs real estate",
    "Latakia real estate",
    "عقارات دمشق",
    "عقارات حلب",
    "عقارات حمص",
    "عقارات اللاذقية",
  ],

  ogImage: "/images/og-via7.png",

  organization: {
    name: "VIA7",
    logo: "/logo1.png",
  },
};

export const absoluteUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
};

export const cleanMetaText = (text: string, maxLength = 160) => {
  return text.replace(/\s+/g, " ").trim().slice(0, maxLength);
};

export const getLocalizedPath = (
  path: string,
  locale: SiteLocale = siteConfig.defaultLocale
) => {
  const cleanPath =
    path === "/"
      ? ""
      : path.startsWith("/")
        ? path
        : `/${path}`;

  return `/${locale}${cleanPath}`;
};

export const getCanonicalPath = (
  path: string,
  locale: SiteLocale = siteConfig.defaultLocale
) => {
  return getLocalizedPath(path, locale);
};

export const getAlternateLanguages = (path: string) => ({
  ar: getLocalizedPath(path, "ar"),
  en: getLocalizedPath(path, "en"),
  de: getLocalizedPath(path, "de"),
  "x-default": getLocalizedPath(path, siteConfig.defaultLocale),
});