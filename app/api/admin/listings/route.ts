import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/users/getCurrentUser";
import { RateLimitService } from "@/app/services/rate-limit";

const ITEMS_PER_PAGE = 10;
const MAX_PAGE = 10_000;
const MAX_QUERY_LENGTH = 100;
const MAX_TYPE_LENGTH = 80;

const VALID_STATUSES = new Set([
  "",
  "active",
  "inactive",
]);

const VALID_FEATURED_VALUES = new Set([
  "",
  "true",
  "false",
]);

const isValidObjectId = (value: string) => {
  return /^[a-f\d]{24}$/i.test(value);
};

const parsePage = (value: string | null) => {
  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return Math.min(page, MAX_PAGE);
};

async function requireAdmin() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      currentUser: null,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  if (
    currentUser.role !== "ADMIN" ||
    currentUser.isBanned
  ) {
    return {
      currentUser: null,
      response: NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return {
    currentUser,
    response: null,
  };
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();

    if (auth.response || !auth.currentUser) {
      return auth.response;
    }

    const currentUser = auth.currentUser;

    const rateLimit =
      await RateLimitService.check({
        key: `admin-listings-get:${currentUser.id}`,
        limit: 180,
        windowSeconds: 60 * 60,
      });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many requests",
          resetInSeconds:
            rateLimit.resetInSeconds,
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(
      request.url
    );

    const rawQuery =
      searchParams.get("query")?.trim() ||
      "";

    if (rawQuery.length > MAX_QUERY_LENGTH) {
      return NextResponse.json(
        { error: "Search query is too long" },
        { status: 400 }
      );
    }

    const query = rawQuery;

    const rawType =
      searchParams.get("type")?.trim() || "";

    if (rawType.length > MAX_TYPE_LENGTH) {
      return NextResponse.json(
        { error: "Invalid listing type" },
        { status: 400 }
      );
    }

    const type = rawType;

    const status =
      searchParams.get("status") || "";

    const featured =
      searchParams.get("featured") || "";

    const page = parsePage(
      searchParams.get("page")
    );

    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json(
        { error: "Invalid listing status" },
        { status: 400 }
      );
    }

    if (
      !VALID_FEATURED_VALUES.has(featured)
    ) {
      return NextResponse.json(
        { error: "Invalid featured filter" },
        { status: 400 }
      );
    }

    const searchConditions:
      Prisma.ListingWhereInput[] = query
        ? [
          ...(isValidObjectId(query)
            ? [
              {
                id: query,
              },
            ]
            : []),

          {
            title: {
              contains: query,
              mode: "insensitive",
            },
          },

          {
            governorate: {
              contains: query,
              mode: "insensitive",
            },
          },

          {
            city: {
              contains: query,
              mode: "insensitive",
            },
          },

          {
            category: {
              contains: query,
              mode: "insensitive",
            },
          },

          {
            type: {
              contains: query,
              mode: "insensitive",
            },
          },

          {
            purpose: {
              contains: query,
              mode: "insensitive",
            },
          },

          {
            user: {
              is: {
                OR: [
                  ...(isValidObjectId(query)
                    ? [
                      {
                        id: query,
                      },
                    ]
                    : []),

                  {
                    name: {
                      contains: query,
                      mode: "insensitive",
                    },
                  },

                  {
                    email: {
                      contains: query,
                      mode: "insensitive",
                    },
                  },
                ],
              },
            },
          },
        ]
        : [];

    const where: Prisma.ListingWhereInput = {
      ...(searchConditions.length > 0
        ? {
          OR: searchConditions,
        }
        : {}),

      ...(type
        ? {
          type,
        }
        : {}),

      ...(status === "active"
        ? {
          isActive: true,
        }
        : {}),

      ...(status === "inactive"
        ? {
          isActive: false,
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
    };

    const [listings, totalCount] =
      await Promise.all([
        prisma.listing.findMany({
          where,

          orderBy: {
            createdAt: "desc",
          },

          skip:
            (page - 1) * ITEMS_PER_PAGE,

          take: ITEMS_PER_PAGE,

          select: {
            id: true,
            title: true,
            price: true,
            governorate: true,
            city: true,
            category: true,
            purpose: true,
            imageUrl: true,
            imageUrls: true,
            isActive: true,
            featured: true,
            viewCount: true,
            favoriteCount: true,
            createdAt: true,
            type: true,

            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),

        prisma.listing.count({
          where,
        }),
      ]);

    const totalPages = Math.ceil(
      totalCount / ITEMS_PER_PAGE
    );

    return NextResponse.json({
      listings,
      totalCount,
      totalPages,
      page,
    });
  } catch (error) {
    console.error(
      "ADMIN_LISTINGS_GET_ERROR",
      error
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}