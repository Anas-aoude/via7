import {
  absoluteUrl,
  cleanMetaText,
  getLocalizedPath,
  siteConfig,
  SiteLocale,
} from "./seo";

type ListingSchemaInput = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  governorate: string;
  city?: string | null;
  district?: string | null;
  address?: string | null;
  imageUrl?: string | null;
  imageUrls?: string[];
  createdAt: Date | string;
};

export const createOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.organization.name,
  url: absoluteUrl("/"),
  logo: absoluteUrl(siteConfig.organization.logo),
});

export const createListingSchema = (
  listing: ListingSchemaInput,
  locale: SiteLocale = siteConfig.defaultLocale
) => {
  const images =
    listing.imageUrls && listing.imageUrls.length > 0
      ? listing.imageUrls
      : listing.imageUrl
        ? [listing.imageUrl]
        : [siteConfig.ogImage];

  const listingPath = getLocalizedPath(`/listings/${listing.id}`, locale);

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",

    name: listing.title,

    description: cleanMetaText(listing.description || listing.title, 500),

    url: absoluteUrl(listingPath),

    image: images.map((image) => absoluteUrl(image)),

    datePosted:
      listing.createdAt instanceof Date
        ? listing.createdAt.toISOString()
        : listing.createdAt,

    address: {
      "@type": "PostalAddress",
      addressCountry: "SY",
      addressRegion: listing.governorate,
      addressLocality: listing.city || listing.governorate,
      streetAddress: listing.address || listing.district || undefined,
    },

    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: absoluteUrl(listingPath),
    },

    provider: createOrganizationSchema(),
  };
};