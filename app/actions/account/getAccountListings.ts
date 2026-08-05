import prisma from "@/app/libs/prismadb";
import getCurrentUser from "../users/getCurrentUser";

interface GetAccountListingsParams {
  page?: number;
  limit?: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const MAX_PAGE = 10_000;

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

export default async function getAccountListings({
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT,
}: GetAccountListingsParams = {}) {
  const safePage = toSafePositiveInteger(
    page,
    DEFAULT_PAGE,
    MAX_PAGE
  );

  const safeLimit = toSafePositiveInteger(
    limit,
    DEFAULT_LIMIT,
    MAX_LIMIT
  );

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.isBanned) {
      return {
        listings: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: safePage,
        limit: safeLimit,
      };
    }

    const skip =
      (safePage - 1) * safeLimit;

    const where = {
      userId: currentUser.id,
    };

    const [listings, totalCount] =
      await Promise.all([
        prisma.listing.findMany({
          where,
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: safeLimit,
          select: {
            id: true,
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
            amenities: true,
            guestCount: true,
            bedroomCount: true,
            bedCount: true,
            bathroomCount: true,
            area: true,
            imageUrl: true,
            imageUrls: true,
            isActive: true,
            featured: true,
            highlighted: true,
            featuredUntil: true,
            boostUntil: true,
            favoriteCount: true,
            viewCount: true,
            createdAt: true,
            updatedAt: true,
          },
        }),

        prisma.listing.count({
          where,
        }),
      ]);

    return {
      listings,
      totalCount,
      totalPages: Math.ceil(
        totalCount / safeLimit
      ),
      currentPage: safePage,
      limit: safeLimit,
    };
  } catch (error) {
    console.error(
      "GET_ACCOUNT_LISTINGS_ERROR",
      error
    );

    return {
      listings: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: safePage,
      limit: safeLimit,
    };
  }
}