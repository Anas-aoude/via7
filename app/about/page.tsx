import type { Metadata } from "next";
import { headers } from "next/headers";

import StaticPage from "@/app/components/static/StaticPage";
import {
  getAlternateLanguages,
  getCanonicalPath,
  siteConfig,
  type SiteLocale,
} from "@/app/libs/seo";
import { translate } from "@/app/libs/translations";

const getCurrentLocale = async (): Promise<SiteLocale> => {
  const headerStore = await headers();
  const locale = headerStore.get("x-locale");

  if (locale === "ar" || locale === "en" || locale === "de") {
    return locale;
  }

  return siteConfig.defaultLocale;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();
  const path = "/about";

  return {
    title: translate(locale, "staticPages.aboutTitle"),
    description: translate(locale, "staticPages.aboutDescription"),

    alternates: {
      canonical: getCanonicalPath(path, locale),
      languages: getAlternateLanguages(path),
    },

    openGraph: {
      title: translate(locale, "staticPages.aboutTitle"),
      description: translate(locale, "staticPages.aboutDescription"),
      url: getCanonicalPath(path, locale),
      siteName: siteConfig.name,
      type: "website",
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function AboutPage() {
  const locale = await getCurrentLocale();
  const t = (key: string) => translate(locale, key);

  return (
    <StaticPage
      title={t("staticPages.aboutTitle")}
      description={t("staticPages.aboutDescription")}
      backLabel={t("staticPages.backHome")}
      backHref={`/${locale}`}
    >
      <section className="space-y-6 ">
        <p>{t("staticPages.aboutParagraph1")}</p>
        <p>{t("staticPages.aboutParagraph2")}</p>
        <p>{t("staticPages.aboutParagraph3")}</p>
      </section>
    </StaticPage>
  );
}