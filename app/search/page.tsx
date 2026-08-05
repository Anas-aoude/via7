import type { Metadata } from "next";
import { headers } from "next/headers";

import getCurrentUser from "@/app/actions/users/getCurrentUser";
import getListings from "@/app/actions/listings/getListings";
import SearchClient from "@/app/components/search/SearchClient";
import {
  getAlternateLanguages,
  getCanonicalPath,
  siteConfig,
  type SiteLocale,
} from "@/app/libs/seo";

interface SearchPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

const getCurrentLocale = async (): Promise<SiteLocale> => {
  const headerStore = await headers();
  const locale = headerStore.get("x-locale");

  if (locale === "ar" || locale === "en" || locale === "de") {
    return locale;
  }

  return siteConfig.defaultLocale;
};

const getSearchSeo = (
  locale: SiteLocale,
  params: Record<string, string | undefined>
) => {
  const location = params.city || params.governorate;
  const category = params.category;

  if (locale === "ar") {
    return {
      title: category
        ? `${category} في ${location || "سوريا"}`
        : `عقارات في ${location || "سوريا"}`,
      description: `اكتشف أفضل العقارات للبيع والإيجار في ${
        location || "سوريا"
        } عبر VIA7.`,
    };
  }

  if (locale === "de") {
    return {
      title: category
        ? `${category} in ${location || "Syrien"}`
        : `Immobilien in ${location || "Syrien"}`,
      description: `Entdecke Immobilien zum Kaufen und Mieten in ${
        location || "Syrien"
        } auf VIA7.`,
    };
  }

  return {
    title: category
      ? `${category} in ${location || "Syria"}`
      : `Properties in ${location || "Syria"}`,
    description: `Discover properties for rent and sale in ${
      location || "Syria"
      } on VIA7.`,
  };
};

const hasSearchParameters = (
  params: Record<string, string | undefined>
): boolean => {
  return Object.values(params).some(
    (value) => typeof value === "string" && value.trim() !== ""
  );
};

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const locale = await getCurrentLocale();
  const seo = getSearchSeo(locale, params);

  const hasFilters = hasSearchParameters(params);
  const canonical = getCanonicalPath("/search", locale);

  return {
    title: seo.title,
    description: seo.description,

    alternates: {
      canonical,
      languages: getAlternateLanguages("/search"),
    },

    openGraph: {
      title: seo.title,
      description: seo.description,
      url: canonical,
      siteName: siteConfig.name,
      type: "website",
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [siteConfig.ogImage],
    },

    robots: hasFilters
      ? {
        index: false,
        follow: true,
        googleBot: {
          index: false,
          follow: true,
        },
      }
      : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
      },
  };
}

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const params = await searchParams;

  const currentUser = await getCurrentUser();
  const data = await getListings(params);

  return (
    <SearchClient
      listings={data.listings}
      currentUser={currentUser}
      totalCount={data.totalCount}
      currentPage={data.currentPage}
      totalPages={data.totalPages}
      searchParams={params}
    />
  );
}