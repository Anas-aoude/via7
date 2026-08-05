import {
  Prisma,
  RentPeriod,
} from "@prisma/client";

import prisma from "@/app/libs/prismadb";
import { SearchCache } from "@/app/services/cache/search.cache";
import {
  convertToUsd,
  Currency,
} from "@/app/libs/currency";
import { getExchangeRates } from "@/app/libs/exchangeRates";

interface IParams {
  category?: string;
  governorate?: string;
  city?: string;
  featured?: string;
  page?: string;
  limit?: string;
  guestCount?: string;
  bedroomCount?: string;
  bathroomCount?: string;
  minPrice?: string;
  maxPrice?: string;
  priceCurrency?: Currency;
  minArea?: string;
  maxArea?: string;
  purpose?: string;
  rentPeriod?: string;
  amenities?: string;
  sortBy?: string;
  startDate?: string;
  endDate?: string;
}

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;
const MAX_PAGE = 10_000;
const MAX_TEXT_LENGTH = 100;
const MAX_AMENITIES = 30;
const MAX_AMENITY_LENGTH = 80;
const MAX_PRICE_INPUT = 1_000_000_000;
const MAX_AREA = 10_000_000;
const MAX_COUNT = 1_000;

const allowedRentPeriods: RentPeriod[] = [
  RentPeriod.DAILY,
  RentPeriod.WEEKLY,
  RentPeriod.MONTHLY,
  RentPeriod.YEARLY,
];

const allowedSortValues = new Set([
  "newest",
  "oldest",
  "priceLow",
  "priceHigh",
  "views",
  "favorites",
]);

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
  boostUntil: true,

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

export type SearchListing =
  Prisma.ListingGetPayload<{
    select: typeof listingSelect;
  }>;

type GetListingsResult = {
  listings: SearchListing[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
};

const cleanText = (
  value: string | undefined,
  maxLength = MAX_TEXT_LENGTH
) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
};

const parsePositiveInteger = (
  value: string | undefined,
  fallback: number,
  max: number
) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return Math.min(parsed, max);
};

const parseOptionalPositiveNumber = (
  value: string | undefined,
  max: number
): number | null => {
  if (!value) {
    return null;
  }

  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number <= 0 ||
    number > max
  ) {
    return null;
  }

  return number;
};

const normalizeCurrency = (
  currency?: string
): Currency => {
  if (
    currency === "EUR" ||
    currency === "SYP" ||
    currency === "USD"
  ) {
    return currency;
  }

  return "USD";
};

const parseDateOnly = (
  value?: string
): Date | null => {
  if (!value) {
    return null;
  }

  const match = value
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
};

const parseAmenities = (
  value?: string
): string[] => {
  if (!value) {
    return [];
  }

  return [
    ...new Set(
      value
        .split(",")
        .map((item) =>
          item
            .trim()
            .slice(0, MAX_AMENITY_LENGTH)
        )
        .filter(Boolean)
    ),
  ].slice(0, MAX_AMENITIES);
};

const buildSearchCacheKey = (
  params: {
    category: string;
    governorate: string;
    city: string;
    featured: string;
    page: number;
    limit: number;
    guestCount: number | null;
    bedroomCount: number | null;
    bathroomCount: number | null;
    minPrice: number | null;
    maxPrice: number | null;
    priceCurrency: Currency;
    minArea: number | null;
    maxArea: number | null;
    purpose: string;
    rentPeriod: RentPeriod | null;
    amenities: string[];
    sortBy: string;
    startDate: string;
    endDate: string;
  }
) => {
  return JSON.stringify(params);
};

export default async function getListings(
  params: IParams = {}
): Promise<GetListingsResult> {
  const currentPage = parsePositiveInteger(
    params.page,
    1,
    MAX_PAGE
  );

  const take = parsePositiveInteger(
    params.limit,
    DEFAULT_LIMIT,
    MAX_LIMIT
  );

  const emptyResult: GetListingsResult = {
    listings: [],
    totalCount: 0,
    totalPages: 0,
    currentPage,
    limit: take,
  };

  try {
    const category = cleanText(params.category);
    const governorate = cleanText(
      params.governorate
    );
    const city = cleanText(params.city);

    const featured =
      params.featured === "true"
        ? "true"
        : params.featured === "false"
          ? "false"
          : "";

    const purpose =
      params.purpose === "rent" ||
        params.purpose === "sale"
        ? params.purpose
        : "";

    const rentPeriod =
      purpose === "rent" &&
        typeof params.rentPeriod === "string" &&
        allowedRentPeriods.includes(
          params.rentPeriod as RentPeriod
        )
        ? (params.rentPeriod as RentPeriod)
        : null;

    const sortBy =
      params.sortBy &&
        allowedSortValues.has(params.sortBy)
        ? params.sortBy
        : "newest";

    const guests =
      parseOptionalPositiveNumber(
        params.guestCount,
        MAX_COUNT
      );

    const bedrooms =
      parseOptionalPositiveNumber(
        params.bedroomCount,
        MAX_COUNT
      );

    const bathrooms =
      parseOptionalPositiveNumber(
        params.bathroomCount,
        MAX_COUNT
      );

    const minPriceInput =
      parseOptionalPositiveNumber(
        params.minPrice,
        MAX_PRICE_INPUT
      );

    const maxPriceInput =
      parseOptionalPositiveNumber(
        params.maxPrice,
        MAX_PRICE_INPUT
      );

    const minArea =
      parseOptionalPositiveNumber(
        params.minArea,
        MAX_AREA
      );

    const maxArea =
      parseOptionalPositiveNumber(
        params.maxArea,
        MAX_AREA
      );

    if (
      minPriceInput !== null &&
      maxPriceInput !== null &&
      minPriceInput > maxPriceInput
    ) {
      return emptyResult;
    }

    if (
      minArea !== null &&
      maxArea !== null &&
      minArea > maxArea
    ) {
      return emptyResult;
    }

    const activePriceCurrency =
      normalizeCurrency(
        params.priceCurrency
      );

    const selectedAmenities =
      parseAmenities(params.amenities);

    const parsedStartDate =
      parseDateOnly(params.startDate);

    const parsedEndDate =
      parseDateOnly(params.endDate);

    const hasDateFilter =
      parsedStartDate !== null &&
      parsedEndDate !== null &&
      parsedStartDate <= parsedEndDate;

    const normalizedCacheParams = {
      category,
      governorate,
      city,
      featured,
      page: currentPage,
      limit: take,
      guestCount: guests,
      bedroomCount: bedrooms,
      bathroomCount: bathrooms,
      minPrice: minPriceInput,
      maxPrice: maxPriceInput,
      priceCurrency: activePriceCurrency,
      minArea,
      maxArea,
      purpose,
      rentPeriod,
      amenities: selectedAmenities,
      sortBy,
      startDate:
        hasDateFilter && parsedStartDate
          ? parsedStartDate
            .toISOString()
            .slice(0, 10)
          : "",
      endDate:
        hasDateFilter && parsedEndDate
          ? parsedEndDate
            .toISOString()
            .slice(0, 10)
          : "",
    };

    const cacheKey = buildSearchCacheKey(
      normalizedCacheParams
    );

    try {
      const cachedResult =
        await SearchCache.for(
          cacheKey
        ).get();

      if (cachedResult) {
        return cachedResult as GetListingsResult;
      }
    } catch (cacheError) {
      console.error(
        "LISTINGS_SEARCH_CACHE_GET_ERROR",
        cacheError
      );
    }

    const rates =
      await getExchangeRates();

    const minPriceUsd =
      minPriceInput !== null
        ? convertToUsd(
          minPriceInput,
          activePriceCurrency,
          rates
        )
        : null;

    const maxPriceUsd =
      maxPriceInput !== null
        ? convertToUsd(
          maxPriceInput,
          activePriceCurrency,
          rates
        )
        : null;

    const where: Prisma.ListingWhereInput = {
      isActive: true,

      user: {
        is: {
          isBanned: false,
        },
      },

      ...(category
        ? {
          category,
        }
        : {}),

      ...(governorate
        ? {
          governorate,
        }
        : {}),

      ...(city
        ? {
          city,
        }
        : {}),

      ...(featured === "true"
        ? {
          featured: true,
        }
        : {}),

      ...(featured === "false"
        ? {
          featured: false,
        }
        : {}),

      ...(guests !== null
        ? {
          guestCount: {
            gte: guests,
          },
        }
        : {}),

      ...(bedrooms !== null
        ? {
          bedroomCount: {
            gte: bedrooms,
          },
        }
        : {}),

      ...(bathrooms !== null
        ? {
          bathroomCount: {
            gte: bathrooms,
          },
        }
        : {}),

      ...(minPriceUsd !== null ||
        maxPriceUsd !== null
        ? {
          price: {
            ...(minPriceUsd !== null
              ? {
                gte: Math.floor(
                  minPriceUsd
                ),
              }
              : {}),
            ...(maxPriceUsd !== null
              ? {
                lte: Math.ceil(
                  maxPriceUsd
                ),
              }
              : {}),
          },
        }
        : {}),

      ...(minArea !== null ||
        maxArea !== null
        ? {
          area: {
            ...(minArea !== null
              ? {
                gte: minArea,
              }
              : {}),
            ...(maxArea !== null
              ? {
                lte: maxArea,
              }
              : {}),
          },
        }
        : {}),

      ...(purpose
        ? {
          purpose,
        }
        : {}),

      ...(purpose === "rent" &&
        rentPeriod
        ? {
          rentPeriod,
        }
        : {}),

      ...(selectedAmenities.length > 0
        ? {
          amenities: {
            hasEvery:
              selectedAmenities,
          },
        }
        : {}),

      ...(hasDateFilter &&
        parsedStartDate &&
        parsedEndDate
        ? {
          AND: [
            {
              OR: [
                {
                  availableFrom: null,
                },
                {
                  availableFrom: {
                    lte: parsedStartDate,
                  },
                },
              ],
            },
            {
              blockedDates: {
                none: {
                  date: {
                    gte: parsedStartDate,
                    lte: parsedEndDate,
                  },
                },
              },
            },
          ],
        }
        : {}),
    };

    let orderBy:
      | Prisma.ListingOrderByWithRelationInput
      | Prisma.ListingOrderByWithRelationInput[] =
    {
      createdAt: "desc",
    };

    switch (sortBy) {
      case "oldest":
        orderBy = {
          createdAt: "asc",
        };
        break;

      case "priceLow":
        orderBy = [
          {
            price: "asc",
          },
          {
            createdAt: "desc",
          },
        ];
        break;

      case "priceHigh":
        orderBy = [
          {
            price: "desc",
          },
          {
            createdAt: "desc",
          },
        ];
        break;

      case "views":
        orderBy = [
          {
            viewCount: "desc",
          },
          {
            createdAt: "desc",
          },
        ];
        break;

      case "favorites":
        orderBy = [
          {
            favoriteCount: "desc",
          },
          {
            createdAt: "desc",
          },
        ];
        break;
    }

    const skip =
      (currentPage - 1) * take;

    const [listings, totalCount] =
      await Promise.all([
        prisma.listing.findMany({
          where,
          orderBy,
          skip,
          take,
          select: listingSelect,
        }),

        prisma.listing.count({
          where,
        }),
      ]);

    const result: GetListingsResult = {
      listings,
      totalCount,
      totalPages: Math.ceil(
        totalCount / take
      ),
      currentPage,
      limit: take,
    };

    try {
      await SearchCache.for(
        cacheKey
      ).set(result);
    } catch (cacheError) {
      console.error(
        "LISTINGS_SEARCH_CACHE_SET_ERROR",
        cacheError
      );
    }

    return result;
  } catch (error) {
    console.error(
      "GET_LISTINGS_ERROR",
      error
    );

    return emptyResult;
  }
}