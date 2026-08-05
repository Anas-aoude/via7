import {
  Prisma,
  UserRole,
} from "@prisma/client";

import prisma from "@/app/libs/prismadb";

const FEATURED_LISTINGS_LIMIT = 7;

const featuredListingSelect = {
  id: true,
  userId: true,
  title: true,
  description: true,
  price: true,

  governorate: true,
  city: true,
  district: true,

  latitude: true,
  longitude: true,

  category: true,
  type: true,
  purpose: true,
  rentPeriod: true,
  availableFrom: true,

  guestCount: true,
  bedroomCount: true,
  bedCount: true,
  bathroomCount: true,
  area: true,
  amenities: true,

  imageUrl: true,
  imageUrls: true,

  isActive: true,
  featured: true,
  highlighted: true,
  featuredUntil: true,

  favoriteCount: true,
  viewCount: true,

  createdAt: true,
  updatedAt: true,

  user: {
    select: {
      id: true,
      role: true,
    },
  },
} satisfies Prisma.ListingSelect;

export type FeaturedListing =
  Prisma.ListingGetPayload<{
    select: typeof featuredListingSelect;
  }>;

export default async function getFeaturedListings(): Promise<
  FeaturedListing[]
> {
  try {
    const now = new Date();

    const listings =
      await prisma.listing.findMany({
        where: {
          isActive: true,
          featured: true,

          user: {
            is: {
              isBanned: false,
            },
          },

          OR: [
            {
              featuredUntil: null,
            },
            {
              featuredUntil: {
                isSet: false,
              },
            },
            {
              featuredUntil: {
                gt: now,
              },
            },
          ],
        },

        orderBy: [
          {
            featuredUntil: "desc",
          },
          {
            createdAt: "desc",
          },
        ],

        take: FEATURED_LISTINGS_LIMIT,

        select: featuredListingSelect,
      });

    return listings;
  } catch (error) {
    console.error(
      "GET_FEATURED_LISTINGS_ERROR",
      error
    );

    return [];
  }
}