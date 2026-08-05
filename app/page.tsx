import type { Metadata } from "next";
import { headers } from "next/headers";

import getListings from "./actions/listings/getListings";
import getFeaturedListings from "./actions/listings/getFeaturedListings";
import getHomepageSections from "./actions/listings/getHomepageSections";
import ListingCard from "./components/listings/ListingCard";
import ListingRow from "./components/listings/ListingRow";
import getCurrentUser from "./actions/users/getCurrentUser";
import { createOrganizationSchema } from "./libs/schema";
import {
  getAlternateLanguages,
  getCanonicalPath,
  siteConfig,
  SiteLocale,
} from "./libs/seo";

interface HomeProps {
  searchParams: Promise<{
    category?: string;
    governorate?: string;
    city?: string;
    featured?: string;
    page?: string;
  }>;
}

const getCurrentLocale = async (): Promise<SiteLocale> => {
  const headerStore = await headers();
  const locale = headerStore.get("x-locale");

  if (locale === "ar" || locale === "en" || locale === "de") {
    return locale;
  }

  return siteConfig.defaultLocale;
};

const getOgLocale = (locale: SiteLocale) => {
  if (locale === "ar") return "ar_SY";
  if (locale === "de") return "de_DE";
  return "en_US";
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale();

  const title = siteConfig.titles[locale];
  const description = siteConfig.descriptions[locale];

  return {
    title,
    description,
    keywords: siteConfig.keywords,
    alternates: {
      canonical: getCanonicalPath("/", locale),
      languages: getAlternateLanguages("/"),
    },
    openGraph: {
      title,
      description,
      url: getCanonicalPath("/", locale),
      siteName: siteConfig.name,
      type: "website",
      locale: getOgLocale(locale),
      alternateLocale: ["ar_SY", "en_US", "de_DE"].filter(
        (item) => item !== getOgLocale(locale)
      ),
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
      title,
      description,
      images: [siteConfig.ogImage],
    },
  };
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const locale = await getCurrentLocale();

  const currentUser = await getCurrentUser();
  const organizationSchema = createOrganizationSchema();

  const hasFilter =
    params.category || params.governorate || params.city || params.featured;

  if (hasFilter) {
    const listingsData = await getListings(params);
    const listings = listingsData.listings;

    return (
      <div className="pt-72 md:pt-56 px-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema).replace(/</g, "\\u003c"),
          }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              data={listing}
              currentUser={currentUser}
            />
          ))}
        </div>
      </div>
    );
  }

  const featuredListings = await getFeaturedListings();
  const homepageSections = await getHomepageSections();

  return (
    <div className="pt-72 md:pt-56 px-8 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema).replace(/</g, "\\u003c"),
        }}
      />

      <div className="flex flex-col gap-12 pt-10">
        {featuredListings.length > 0 && (
          <ListingRow
            title="Featured properties"
            listings={featuredListings}
            currentUser={currentUser}
            seeAllHref={`/${locale}/search?featured=true`}
            totalCount={featuredListings.length}
          />
        )}

        {homepageSections.map((section) => (
          <ListingRow
            key={section.governorate}
            title={`Popular homes in ${section.governorate}`}
            listings={section.listings}
            currentUser={currentUser}
            seeAllHref={`/${locale}/search?governorate=${encodeURIComponent(
              section.governorate
            )}`}
            totalCount={section.count}
          />
        ))}
      </div>
    </div>
  );
}