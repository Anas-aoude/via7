import {
  Prisma,
  UserRole,
} from "@prisma/client";

import prisma from "@/app/libs/prismadb";
import { UserCache } from "@/app/services/cache/user.cache";

interface IParams {
  userId?: string;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;
const MAX_PAGE = 10_000;

const isValidObjectId = (value: string) => {
  return /^[a-f\d]{24}$/i.test(value);
};

const toSafePositiveInteger = (
  value: number | undefined,
  fallback: number,
  max: number
) => {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1
  ) {
    return fallback;
  }

  return Math.min(value, max);
};

const profileListingSelect = {
  id: true,
  title: true,
  description: true,
  price: true,
  street: true,
  address: true,
  featuredUntil: true,
  boostUntil: true,
  userId: true,
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
  favoriteCount: true,
  viewCount: true,

  createdAt: true,
  updatedAt: true,

  reviews: {
    where: {
      isHidden: false,
    },
    select: {
      rating: true,
    },
  },
} satisfies Prisma.ListingSelect;

type UserProfileListing =
  Prisma.ListingGetPayload<{
    select: typeof profileListingSelect;
  }>;

export type UserProfileResult = {
  id: string;
  name: string | null;
  role: UserRole;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;

  listings: UserProfileListing[];

  _count: {
    listings: number;
    reviewsReceived: number;
  };

  totalViews: number;
  totalFavorites: number;
  averageRating: number;
  totalReviews: number;

  listingsTotalCount: number;
  listingsTotalPages: number;
  listingsCurrentPage: number;
  listingsLimit: number;
};

export default async function getUserProfileById(
  params: IParams,
  options: PaginationOptions = {}
): Promise<UserProfileResult | null> {
  const page = toSafePositiveInteger(
    options.page,
    DEFAULT_PAGE,
    MAX_PAGE
  );

  const limit = toSafePositiveInteger(
    options.limit,
    DEFAULT_LIMIT,
    MAX_LIMIT
  );

  try {
    const userId = params.userId;

    if (
      !userId ||
      typeof userId !== "string" ||
      !isValidObjectId(userId)
    ) {
      return null;
    }

    const skip = (page - 1) * limit;

    const cacheKey =
      `${userId}:page:${page}:limit:${limit}`;

    try {
      const cachedUser =
        await UserCache.for<UserProfileResult>(
          cacheKey
        ).get();

      if (cachedUser) {
        return cachedUser;
      }
    } catch (cacheError) {
      console.error(
        "USER_PROFILE_CACHE_GET_ERROR",
        cacheError
      );
    }

    const [
      user,
      listingsTotalCount,
      visibleReceivedReviewsCount,
    ] = await Promise.all([
      prisma.user.findFirst({
        where: {
          id: userId,
          isBanned: false,
        },
        select: {
          id: true,
          name: true,
          role: true,
          avatarUrl: true,
          bio: true,
          createdAt: true,

          listings: {
            where: {
              isActive: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            skip,
            take: limit,
            select: profileListingSelect,
          },

          _count: {
            select: {
              listings: {
                where: {
                  isActive: true,
                },
              },
            },
          },
        },
      }),

      prisma.listing.count({
        where: {
          userId,
          isActive: true,
          user: {
            is: {
              isBanned: false,
            },
          },
        },
      }),

      prisma.review.count({
        where: {
          targetId: userId,
          isHidden: false,
        },
      }),
    ]);

    if (!user) {
      return null;
    }

    const allListingsForStats =
      await prisma.listing.findMany({
        where: {
          userId,
          isActive: true,
        },
        select: {
          viewCount: true,
          favoriteCount: true,

          reviews: {
            where: {
              isHidden: false,
            },
            select: {
              rating: true,
            },
          },
        },
      });

    const totalViews =
      allListingsForStats.reduce(
        (total, listing) =>
          total + listing.viewCount,
        0
      );

    const totalFavorites =
      allListingsForStats.reduce(
        (total, listing) =>
          total + listing.favoriteCount,
        0
      );

    const allRatings =
      allListingsForStats.flatMap(
        (listing) =>
          listing.reviews.map(
            (review) => review.rating
          )
      );

    const totalReviews =
      allRatings.length;

    const averageRating =
      totalReviews > 0
        ? Number(
          (
            allRatings.reduce(
              (total, rating) =>
                total + rating,
              0
            ) / totalReviews
          ).toFixed(1)
        )
        : 0;

    const result: UserProfileResult = {
      id: user.id,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt,

      listings: user.listings,

      _count: {
        listings: user._count.listings,
        reviewsReceived:
          visibleReceivedReviewsCount,
      },

      totalViews,
      totalFavorites,
      averageRating,
      totalReviews,

      listingsTotalCount,
      listingsTotalPages:
        Math.ceil(
          listingsTotalCount / limit
        ),
      listingsCurrentPage: page,
      listingsLimit: limit,
    };

    try {
      await UserCache.for<UserProfileResult>(
        cacheKey
      ).set(result);
    } catch (cacheError) {
      console.error(
        "USER_PROFILE_CACHE_SET_ERROR",
        cacheError
      );
    }

    return result;
  } catch (error) {
    console.error(
      "GET_USER_PROFILE_BY_ID_ERROR",
      error
    );

    return null;
  }
}