import {
  Prisma,
  UserRole,
} from "@prisma/client";

import prisma from "@/app/libs/prismadb";
import { HomepageCache } from "@/app/services/cache/homepage.cache";

const MAX_SECTIONS = 10;
const LISTINGS_PER_SECTION = 8;

const PRIORITY_GOVERNORATES = [
  "Damascus",
  "Rif Dimashq",
];

const homepageListingSelect = {
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

  favoriteCount: true,
  viewCount: true,

  createdAt: true,
  updatedAt: true,

  user: {
    select: {
      role: true,
    },
  },
} satisfies Prisma.ListingSelect;

export type HomepageListing =
  Prisma.ListingGetPayload<{
    select: typeof homepageListingSelect;
  }>;

export interface HomepageSection {
  governorate: string;
  count: number;
  listings: HomepageListing[];
}

const sortGovernorates = (
  a: { governorate: string; count: number },
  b: { governorate: string; count: number }
) => {
  const aIndex =
    PRIORITY_GOVERNORATES.indexOf(
      a.governorate
    );

  const bIndex =
    PRIORITY_GOVERNORATES.indexOf(
      b.governorate
    );

  if (aIndex !== -1 && bIndex !== -1) {
    return aIndex - bIndex;
  }

  if (aIndex !== -1) {
    return -1;
  }

  if (bIndex !== -1) {
    return 1;
  }

  return b.count - a.count;
};

export default async function getHomepageSections(): Promise<
  HomepageSection[]
> {
  try {
    try {
      const cachedSections =
        await HomepageCache.get();

      if (cachedSections) {
        return cachedSections as HomepageSection[];
      }
    } catch (cacheError) {
      console.error(
        "HOMEPAGE_CACHE_GET_ERROR",
        cacheError
      );
    }

    /*
     * أولًا نحصل على عدد الإعلانات النشطة
     * لكل محافظة، بدون تحميل جميع الإعلانات.
     */
    const governorateGroups =
      await prisma.listing.groupBy({
        by: ["governorate"],
        where: {
          isActive: true,

          user: {
            is: {
              isBanned: false,
            },
          },
        },
        _count: {
          _all: true,
        },
      });

    const selectedGovernorates =
      governorateGroups
        .map((group) => ({
          governorate: group.governorate,
          count: group._count._all,
        }))
        .sort(sortGovernorates)
        .slice(0, MAX_SECTIONS);

    if (
      selectedGovernorates.length === 0
    ) {
      return [];
    }

    /*
     * نجلب فقط آخر 8 إعلانات لكل محافظة مختارة.
     */
    const sections = await Promise.all(
      selectedGovernorates.map(
        async ({ governorate, count }) => {
          const listings =
            await prisma.listing.findMany({
              where: {
                governorate,
                isActive: true,

                user: {
                  is: {
                    isBanned: false,
                  },
                },
              },

              orderBy: [
                {
                  featured: "desc",
                },
                {
                  createdAt: "desc",
                },
              ],

              take: LISTINGS_PER_SECTION,

              select: homepageListingSelect,
            });

          return {
            governorate,
            count,
            listings,
          };
        }
      )
    );

    try {
      await HomepageCache.set(sections);
    } catch (cacheError) {
      console.error(
        "HOMEPAGE_CACHE_SET_ERROR",
        cacheError
      );
    }

    return sections;
  } catch (error) {
    console.error(
      "GET_HOMEPAGE_SECTIONS_ERROR",
      error
    );

    return [];
  }
}