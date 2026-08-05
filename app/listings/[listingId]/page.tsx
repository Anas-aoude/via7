import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getServerTranslation } from "@/app/libs/serverTranslation";
import Price from "@/app/components/common/Price";
import {
  FaAward,
  FaBath,
  FaBed,
  FaCalendarAlt,
  FaCheckCircle,
  FaCrown,
  FaHome,
  FaMapMarkerAlt,
  FaRulerCombined,
  FaShieldAlt,
  FaStar,
  FaUserFriends,
} from "react-icons/fa";
import { headers } from "next/headers";
import {
  absoluteUrl,
  cleanMetaText,
  getAlternateLanguages,
  getCanonicalPath,
  siteConfig,
  SiteLocale,
} from "@/app/libs/seo";

import getCurrentUser from "@/app/actions/users/getCurrentUser";
import getListingById from "@/app/actions/listings/getListingById";
import getReviewsByListingId from "@/app/actions/reviews/getReviewsByListingId";
import increaseListingViews from "@/app/actions/listings/increaseListingViews";
import ContactOwnerButton from "@/app/components/listings/ContactOwnerButton";
import ImageGallery from "@/app/components/listings/ImageGallery";
import ListingActions from "@/app/components/listings/ListingActions";
import ListingLocationMapWrapper from "@/app/components/listings/ListingLocationMapWrapper";
import ReviewSection from "@/app/components/listings/ReviewSection";
import { amenities as amenitiesList } from "@/app/constants/amenities";
import { dictionary } from "@/app/libs/dictionary";
import { createListingSchema } from "@/app/libs/schema";

interface IParams {
  listingId?: string;
}

interface ListingPageProps {
  params: Promise<IParams>;
}

const getCurrentLocale = async (): Promise<SiteLocale> => {
  const headerStore = await headers();
  const locale = headerStore.get("x-locale");

  if (locale === "ar" || locale === "en" || locale === "de") {
    return locale;
  }

  return siteConfig.defaultLocale;
};

export async function generateMetadata({
  params,
}: ListingPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const listing = await getListingById(resolvedParams);
  const locale = await getCurrentLocale();
  if (!listing) {
    return {
      title: "Listing Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const location = [listing.city, listing.district, listing.governorate]
    .filter(Boolean)
    .join(", ");

  const purposeText = listing.purpose === "rent" ? "for Rent" : "for Sale";

  const title = `${listing.title} ${purposeText} in ${listing.governorate}`;

  const description =
    cleanMetaText(listing.description) ||
    cleanMetaText(
      `${listing.category} ${purposeText} in ${location}. View photos, price, location and contact the owner on VIA7.`
    );

  const image = listing.imageUrls?.[0] || listing.imageUrl || "/logo1.png";

  const canonical = getCanonicalPath(`/listings/${listing.id}`, locale);
  const absoluteImageUrl = absoluteUrl(image);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: getAlternateLanguages(`/listings/${listing.id}`),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "VIA7",
      type: "article",
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: listing.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteImageUrl],
    },
    robots: {
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

const getDictionaryValue = (
  group: keyof typeof dictionary,
  value: string | null | undefined,
  t: (key: string) => string
) => {
  if (!value) return "";

  const key = (dictionary[group] as Record<string, string>)[value];

  if (!key) {
    return value;
  }

  return t(key);
};

const getPriceLabel = (
  purpose: string,
  rentPeriod: string | null | undefined,
  t: (key: string) => string
) => {
  if (purpose !== "rent") {
    return ` ${t("listingDetails.total")}`;
  }

  if (rentPeriod === "DAILY") {
    return ` ${t("listingDetails.day")}`;
  }

  if (rentPeriod === "WEEKLY") {
    return ` ${t("listingDetails.week")}`;
  }

  if (rentPeriod === "YEARLY") {
    return ` ${t("listingDetails.year")}`;
  }

  return ` ${t("listingDetails.month")}`;
};
const formatAvailableFrom = (value: Date | string | null | undefined) => {
  if (!value) return null;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};
const getListingDetailStats = (
  listing: any,
  t: (key: string) => string
) => {
  const stats = [];

  if (listing.guestCount && listing.guestCount > 0) {
    stats.push({
      icon: FaUserFriends,
      value: listing.guestCount,
      label: t("listingDetails.guests"),
    });
  }

  if (listing.bedroomCount && listing.bedroomCount > 0) {
    stats.push({
      icon: FaHome,
      value: listing.bedroomCount,
      label: t("listingDetails.bedrooms"),
    });
  }

  if (listing.bedCount && listing.bedCount > 0) {
    stats.push({
      icon: FaBed,
      value: listing.bedCount,
      label: t("listingDetails.beds"),
    });
  }

  if (listing.bathroomCount && listing.bathroomCount > 0) {
    stats.push({
      icon: FaBath,
      value: listing.bathroomCount,
      label: t("listingDetails.bathrooms"),
    });
  }

  if (listing.area && listing.area > 0) {
    stats.push({
      icon: FaRulerCombined,
      value: listing.area,
      label: "m²",
    });
  }

  return stats;
};

const getOwnerBadge = (role?: string | null) => {
  if (role === "VIP_HOST") {
    return {
      labelKey: "listingDetails.vipHost",
      icon: FaCrown,
    };
  }

  if (role === "ADMIN") {
    return {
      labelKey: "listingDetails.verifiedAdmin",
      icon: FaShieldAlt,
    };
  }

  if (role === "MANAGER") {
    return {
      labelKey: "listingDetails.verifiedManager",
      icon: FaShieldAlt,
    };
  }

  if (role === "HOST") {
    return {
      labelKey: "listingDetails.verifiedHost",
      icon: FaCheckCircle,
    };
  }

  return {
    labelKey: "listingDetails.propertyOwner",
    icon: FaHome,
  };
};
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  result.setHours(0, 0, 0, 0);
  return result;
};

const getRealAvailableFrom = (
  availableFrom: Date | string | null | undefined,
  blockedDates: { date: Date | string }[] = []
) => {
  if (!availableFrom) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const baseAvailableFrom = new Date(availableFrom);
  baseAvailableFrom.setHours(0, 0, 0, 0);

  let current = baseAvailableFrom < today ? today : baseAvailableFrom;

  const blockedSet = new Set(
    blockedDates.map((item) => {
      const date = new Date(item.date);
      date.setHours(0, 0, 0, 0);
      return date.toISOString().split("T")[0];
    })
  );

  while (blockedSet.has(current.toISOString().split("T")[0])) {
    current = addDays(current, 1);
  }

  return current;
};
export default async function ListingPage({ params }: ListingPageProps) {
  const currentUser = await getCurrentUser();
  const { t, language } = await getServerTranslation();

  if (currentUser?.isBanned) {
    redirect("/");
  }

  const resolvedParams = await params;

  const listing = await getListingById(resolvedParams);

  if (!listing) {
    return (
      <div className="pt-60 px-8">
        {t("listingDetails.listingNotFound")}
      </div>
    );
  }

  await increaseListingViews(listing.id);

  const reviews = await getReviewsByListingId(listing.id);

  const images =
    listing.imageUrls && listing.imageUrls.length > 0
      ? listing.imageUrls
      : listing.imageUrl
        ? [listing.imageUrl]
        : [];

  const ownerName = listing.user?.name || t("listingDetails.propertyOwner");
  const ownerImage = listing.user?.avatarUrl || null;
  const ownerListingsCount = listing.user?._count?.listings || 0;
  const ownerJoinedYear = listing.user?.createdAt
    ? new Date(listing.user.createdAt).getFullYear()
    : null;

  const ownerBadge = getOwnerBadge(listing.user?.role);
  const OwnerBadgeIcon = ownerBadge.icon;

  const priceLabel = getPriceLabel(listing.purpose, listing.rentPeriod, t);
  const realAvailableFrom = getRealAvailableFrom(
    listing.availableFrom,
    listing.blockedDates
  );

  const availableFromLabel = formatAvailableFrom(realAvailableFrom);
  const detailStats = getListingDetailStats(listing, t);

  const categoryLabel = getDictionaryValue("category", listing.category, t);
  const governorateLabel = getDictionaryValue(
    "governorate",
    listing.governorate,
    t
  );

  const selectedAmenities = amenitiesList.filter((item) =>
    listing.amenities?.includes(item.label)
  );
  const listingSchema = createListingSchema(listing, language);

  return (
    <div className="pt-72 md:pt-60 max-w-screen-xl mx-auto px-6 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(listingSchema).replace(/</g, "\\u003c"),
        }}
      />
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>

          <div className="text-neutral-600">
            {governorateLabel}
            {listing.city ? `, ${listing.city}` : ""}
            {listing.district ? `, ${listing.district}` : ""}
          </div>
        </div>

        {currentUser && (
          <ListingActions listingId={listing.id} currentUser={currentUser} />
        )}
      </div>

      <div className="mb-6" />

      <ImageGallery title={listing.title} images={images} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2">
          <div className="text-2xl font-semibold mb-5">
            {categoryLabel} {t("listingDetails.in")} {governorateLabel}
          </div>

          {detailStats.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {detailStats.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="border rounded-2xl p-4 bg-white">
                    <Icon size={22} className="mb-3" />

                    <div className="font-semibold">
                      {item.value}
                    </div>

                    <div className="text-sm text-neutral-500">
                      {item.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}


          <hr className="mb-6" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            <div className="flex gap-4">
              <FaAward size={24} className="mt-1 shrink-0" />
              <div>
                <div className="font-semibold">
                  {t("listingDetails.guestFavorite")}
                </div>
                <div className="text-sm text-neutral-500">
                  {t("listingDetails.guestFavoriteDescription")}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <FaShieldAlt size={24} className="mt-1 shrink-0" />
              <div>
                <div className="font-semibold">
                  {t("listingDetails.verifiedOwner")}
                </div>
                <div className="text-sm text-neutral-500">
                  {t("listingDetails.verifiedOwnerDescription")}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <FaMapMarkerAlt size={24} className="mt-1 shrink-0" />
              <div>
                <div className="font-semibold">
                  {t("listingDetails.locationAvailable")}
                </div>
                <div className="text-sm text-neutral-500">
                  {t("listingDetails.locationAvailableDescription")}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <FaCheckCircle size={24} className="mt-1 shrink-0" />
              <div>
                <div className="font-semibold">
                  {t("listingDetails.directContact")}
                </div>
                <div className="text-sm text-neutral-500">
                  {t("listingDetails.directContactDescription")}
                </div>
              </div>
            </div>
          </div>

          <hr className="mb-6" />

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">
              {t("listingDetails.aboutThisPlace")}
            </h2>

            <p className="text-lg leading-8 text-neutral-700">
              {listing.description}
            </p>

            <div className="md:hidden mb-8 border rounded-xl p-6 shadow-lg">
              <div className="text-2xl font-bold mb-4">
                <Price amount={listing.price} />

                <span className="text-base font-normal text-neutral-500">
                  {priceLabel}
                </span>
              </div>

              {availableFromLabel && (
                <div className="mb-4 flex items-center gap-3 rounded-xl border bg-neutral-50 p-4">
                  <FaCalendarAlt className="shrink-0" />

                  <div>
                    <div className="font-semibold">
                      {t("listingDetails.availableFrom")}
                    </div>

                    <div className="text-sm text-neutral-500">
                      {availableFromLabel}
                    </div>
                  </div>
                </div>
              )}

              {currentUser ? (
                <ContactOwnerButton
                  listingId={listing.id}
                  ownerId={listing.userId}
                  currentUserId={currentUser.id}
                />
              ) : (
                  <Link
                    href={`/${language}`}
                    className="block w-full rounded-lg bg-primary px-4 py-3 text-center font-semibold text-white hover:bg-primary-hover"
                  >
                    {t("auth.login")}
                  </Link>
                )}

              <div className="text-sm text-neutral-500 mt-4 text-center">
                {t("listingDetails.contactOwner")}
              </div>
            </div>
          </div>

          {selectedAmenities.length > 0 && (
            <>
              <hr className="mb-6" />

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">
                  {t("listingDetails.whatThisPlaceOffers")}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {selectedAmenities.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.label}
                        className="flex items-center gap-4 text-neutral-800"
                      >
                        <Icon size={24} />
                        <span className="text-lg">
                          {getDictionaryValue("amenity", item.label, t)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <hr className="mb-6" />

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {t("listingDetails.hostedBy")} {ownerName}
            </h2>

            <div className="border rounded-3xl p-6 bg-white shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <Link href={`/${language}/users/${listing.userId}`} className="shrink-0">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center">
                    {ownerImage ? (
                      <Image
                        src={ownerImage}
                        alt={ownerName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                        <span className="text-4xl">👤</span>
                      )}
                  </div>
                </Link>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <Link
                      href={`/${language}/users/${listing.userId}`}
                      className="text-2xl font-bold hover:underline"
                    >
                      {ownerName}
                    </Link>

                    <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold">
                      <OwnerBadgeIcon size={14} />
                      {t(ownerBadge.labelKey)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
                    <div>
                      <div className="flex items-center gap-2 font-semibold">
                        <FaStar />
                        4.9
                      </div>
                      <div className="text-sm text-neutral-500">
                        {t("listingDetails.rating")}
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold">{ownerListingsCount}</div>
                      <div className="text-sm text-neutral-500">
                        {t("listingDetails.listings")}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 font-semibold">
                        <FaCalendarAlt />
                        {ownerJoinedYear || "-"}
                      </div>
                      <div className="text-sm text-neutral-500">
                        {t("listingDetails.joined")}
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold">
                        {t("listingDetails.fast")}
                      </div>
                      <div className="text-sm text-neutral-500">
                        {t("listingDetails.response")}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 text-neutral-600">
                    {t("listingDetails.contactOwner")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ReviewSection
            listingId={listing.id}
            ownerId={listing.userId}
            currentUser={currentUser}
            initialReviews={reviews.map((review) => ({
              ...review,
              createdAt: review.createdAt.toISOString(),
              updatedAt: review.updatedAt.toISOString(),
            }))}
          />

          <hr className="my-8" />

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">
              {t("listingDetails.whereYouWillBe")}
            </h2>

            <div className="text-neutral-700 mb-4">
              {listing.address && <div>{listing.address}</div>}

              <div>
                {listing.city ? `${listing.city}, ` : ""}
                {governorateLabel}
              </div>
            </div>

            {listing.latitude !== null && listing.longitude !== null && (
              <ListingLocationMapWrapper
                latitude={listing.latitude}
                longitude={listing.longitude}
              />
            )}

            <p className="text-sm text-neutral-500 mt-4">
              {t("listingDetails.exactLocation")}
            </p>
          </div>
        </div>

        <div className="hidden md:block border rounded-xl p-6 shadow-lg h-fit sticky top-60">
          <div className="text-2xl font-bold mb-4">
            <Price amount={listing.price} />

            <span className="text-base font-normal text-neutral-500">
              {priceLabel}
            </span>
          </div>
          {availableFromLabel && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border bg-neutral-50 p-4">
              <FaCalendarAlt className="shrink-0" />
              <div>
                <div className="font-semibold">
                  {t("listingDetails.availableFrom")}
                </div>
                <div className="text-sm text-neutral-500">
                  {availableFromLabel}
                </div>
              </div>
            </div>
          )}

          {currentUser ? (
            <ContactOwnerButton
              listingId={listing.id}
              ownerId={listing.userId}
              currentUserId={currentUser.id}
            />
          ) : (
              <Link href={`/${language}`}
                className="block w-full rounded-lg bg-primary px-4 py-3 text-center font-semibold text-white hover:bg-primary-hover"
              >
                {t("auth.login")}
              </Link>
            )}

          <div className="text-sm text-neutral-500 mt-4 text-center">
            {t("listingDetails.contactOwner")}
          </div>
        </div>
      </div>
    </div>
  );
}