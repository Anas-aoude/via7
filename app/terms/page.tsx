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
  const path = "/terms";

  const title = translate(locale, "staticPages.termsTitle");
  const description = translate(locale, "staticPages.termsDescription");

  return {
    title,
    description,

    alternates: {
      canonical: getCanonicalPath(path, locale),
      languages: getAlternateLanguages(path),
    },

    openGraph: {
      title,
      description,
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

export default async function TermsPage() {
  const locale = await getCurrentLocale();
  const t = (key: string) => translate(locale, key);

  const sections = [
    ["termsIntroTitle", "termsIntroText"],
    ["termsServiceTitle", "termsServiceText"],
    ["termsEligibilityTitle", "termsEligibilityText"],
    ["termsAccountsTitle", "termsAccountsText"],
    ["termsListingsTitle", "termsListingsText"],
    ["termsProhibitedTitle", "termsProhibitedText"],
    ["termsModerationTitle", "termsModerationText"],
    ["termsTransactionsTitle", "termsTransactionsText"],
    ["termsMessagesTitle", "termsMessagesText"],
    ["termsReviewsTitle", "termsReviewsText"],
    ["termsIntellectualPropertyTitle", "termsIntellectualPropertyText"],
    ["termsAvailabilityTitle", "termsAvailabilityText"],
    ["termsLiabilityTitle", "termsLiabilityText"],
    ["termsSuspensionTitle", "termsSuspensionText"],
    ["termsChangesTitle", "termsChangesText"],
    ["termsLawTitle", "termsLawText"],
  ] as const;

  return (
    <StaticPage
      title={t("staticPages.termsTitle")}
      description={t("staticPages.termsDescription")}
      backLabel={t("staticPages.backHome")}
      backHref={`/${locale}`}
    >
      <div className="space-y-10">
        {sections.map(([titleKey, textKey]) => (
          <section key={titleKey} className="space-y-3">
            <h2 className="text-xl font-bold text-neutral-900">
              {t(`staticPages.${titleKey}`)}
            </h2>

            <p>{t(`staticPages.${textKey}`)}</p>
          </section>
        ))}
      </div>
    </StaticPage>
  );
}