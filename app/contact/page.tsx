import type { Metadata } from "next";
import Link from "next/link";
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
  const path = "/contact";

  const title = translate(locale, "staticPages.contactTitle");
  const description = translate(locale, "staticPages.contactDescription");
  const canonical = getCanonicalPath(path, locale);

  return {
    title,
    description,

    alternates: {
      canonical,
      languages: getAlternateLanguages(path),
    },

    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.name,
      type: "website",
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ContactPage() {
  const locale = await getCurrentLocale();
  const t = (key: string) => translate(locale, key);

  const contactSections = [
    {
      title: t("staticPages.contactGeneralTitle"),
      text: t("staticPages.contactGeneralText"),
      email: t("staticPages.contactSupportEmail"),
    },
    {
      title: t("staticPages.contactPrivacyTitle"),
      text: t("staticPages.contactPrivacyText"),
      email: t("staticPages.contactPrivacyEmail"),
    },
    {
      title: t("staticPages.contactBusinessTitle"),
      text: t("staticPages.contactBusinessText"),
      email: t("staticPages.contactBusinessEmail"),
    },
  ];

  return (
    <StaticPage
      title={t("staticPages.contactTitle")}
      description={t("staticPages.contactDescription")}
      backLabel={t("staticPages.backHome")}
      backHref={`/${locale}`}
    >
      <div className="space-y-10">
        {contactSections.map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className="text-xl font-bold text-neutral-900">
              {section.title}
            </h2>

            <p>{section.text}</p>

            <p>
              <span className="font-semibold">
                {t("staticPages.contactEmailLabel")}:
              </span>{" "}
              <a
                href={`mailto:${section.email}`}
                className="font-semibold text-neutral-900 underline underline-offset-4"
              >
                {section.email}
              </a>
            </p>
          </section>
        ))}

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-900">
            {t("staticPages.contactReportTitle")}
          </h2>

          <p>{t("staticPages.contactReportText")}</p>

          <Link
            href={`/${locale}/report`}
            className="inline-flex font-semibold text-neutral-900 underline underline-offset-4"
          >
            {t("staticPages.contactReportLink")}
          </Link>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-900">
            {t("staticPages.contactResponseTitle")}
          </h2>

          <p>{t("staticPages.contactResponseText")}</p>
        </section>
      </div>
    </StaticPage>
  );
}