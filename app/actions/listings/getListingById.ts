import { cache } from "react";
import type { Prisma } from "@prisma/client";

import prisma from "@/app/libs/prismadb";
import { ListingCache } from "@/app/services/cache/listing.cache";

interface IParams {
  listingId?: string;
}

const isValidObjectId = (value: string) => {
  return /^[a-f\d]{24}$/i.test(value);
};

const listingSelect = {
  id: true,
  userId: true,
  title: true,
  description: true,
  price: true,

  governorate: true,
  city: true,
  district: true,
  street: true,
  address: true,

  latitude: true,
  longitude: true,

  category: true,
  type: true,
  purpose: true,
  rentPeriod: true,
  availableFrom: true,

  featuredUntil: true,
  boostUntil: true,
  highlighted: true,

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
  favoriteCount: true,
  viewCount: true,

  createdAt: true,
  updatedAt: true,


  user: {
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      bio: true,
      role: true,
      isBanned: true,
      createdAt: true,

      _count: {
        select: {
          listings: true,
        },
      },
    },
  },

  blockedDates: {
    orderBy: {
      date: "asc",
    },
    select: {
      id: true,
      date: true,
    },
  },
} satisfies Prisma.ListingSelect;

export type ListingWithDetails =
  Prisma.ListingGetPayload<{
    select: typeof listingSelect;
  }>;

const getListingById = cache(
  async (
    params: IParams
  ): Promise<ListingWithDetails | null> => {
    try {
      const listingId = params.listingId;

      if (
        !listingId ||
        typeof listingId !== "string" ||
        !isValidObjectId(listingId)
      ) {
        return null;
      }

      try {
        const cachedListing =
          await ListingCache.for<ListingWithDetails>(
            listingId
          ).get();

        if (
          cachedListing &&
          typeof cachedListing === "object" &&
          "blockedDates" in cachedListing &&
          "user" in cachedListing
        ) {
          const listing = cachedListing as ListingWithDetails;

          if (
            !listing.user ||
            listing.user.isBanned
          ) {
            return null;
          }

          return listing;
        }
      } catch (cacheError) {
        console.error(
          "LISTING_CACHE_GET_ERROR",
          cacheError
        );
      }

      const listing =
        await prisma.listing.findFirst({
          where: {
            id: listingId,

            user: {
              is: {
                isBanned: false,
              },
            },
          },

          select: listingSelect,
        });

      if (!listing) {
        return null;
      }

      try {
        await ListingCache.for<ListingWithDetails>(
          listingId
        ).set(listing);
      } catch (cacheError) {
        console.error(
          "LISTING_CACHE_SET_ERROR",
          cacheError
        );
      }

      return listing;
    } catch (error) {
      console.error(
        "GET_LISTING_BY_ID_ERROR",
        error
      );

      return null;
    }
  }
);

export default getListingById;