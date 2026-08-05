import { NextResponse } from "next/server";
import {
  Prisma,
  UserRole,
} from "@prisma/client";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/users/getCurrentUser";
import { RateLimitService } from "@/app/services/rate-limit";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MAX_PAGE = 10_000;
const MAX_SEARCH_LENGTH = 100;

const manageableUserRoles: UserRole[] = [
  UserRole.USER,
  UserRole.HOST,
  UserRole.VIP_HOST,
  UserRole.AGENCY,
];

const isValidObjectId = (value: string) => {
  return /^[a-f\d]{24}$/i.test(value);
};

const parsePositiveInteger = (
  value: string | null,
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

async function requireManager() {
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
    currentUser.role !== UserRole.MANAGER ||
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
    const auth = await requireManager();

    if (
      auth.response ||
      !auth.currentUser
    ) {
      return auth.response;
    }

    const currentUser = auth.currentUser;

    const rateLimit =
      await RateLimitService.check({
        key: `manager-users-get:${currentUser.id}`,
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

    const page = parsePositiveInteger(
      searchParams.get("page"),
      1,
      MAX_PAGE
    );

    const limit = parsePositiveInteger(
      searchParams.get("limit"),
      DEFAULT_LIMIT,
      MAX_LIMIT
    );

    const search =
      searchParams.get("search")?.trim() ||
      "";

    if (
      search.length > MAX_SEARCH_LENGTH
    ) {
      return NextResponse.json(
        {
          error: "Search query is too long",
        },
        { status: 400 }
      );
    }

    const roleParam =
      searchParams.get("role")?.trim() ||
      "";

    const status =
      searchParams.get("status")?.trim() ||
      "";

    let role: UserRole | undefined;

    if (roleParam) {
      if (
        !manageableUserRoles.includes(
          roleParam as UserRole
        )
      ) {
        return NextResponse.json(
          { error: "Invalid role filter" },
          { status: 400 }
        );
      }

      role = roleParam as UserRole;
    }

    if (
      status &&
      status !== "active" &&
      status !== "banned"
    ) {
      return NextResponse.json(
        { error: "Invalid status filter" },
        { status: 400 }
      );
    }

    const searchConditions:
      Prisma.UserWhereInput[] = search
        ? [
          ...(isValidObjectId(search)
            ? [
              {
                id: search,
              },
            ]
            : []),

          {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },

          {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            phoneNumber: {
              contains: search,
              mode: "insensitive",
            },
          },
        ]
        : [];

    const where: Prisma.UserWhereInput = {
      role: role
        ? role
        : {
          in: manageableUserRoles,
        },

      ...(status === "active"
        ? {
          isBanned: false,
        }
        : {}),

      ...(status === "banned"
        ? {
          isBanned: true,
        }
        : {}),

      ...(searchConditions.length > 0
        ? {
          OR: searchConditions,
        }
        : {}),
    };

    const [users, totalCount] =
      await Promise.all([
        prisma.user.findMany({
          where,

          orderBy: {
            createdAt: "desc",
          },

          skip: (page - 1) * limit,
          take: limit,

          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            role: true,
            isBanned: true,
            createdAt: true,
            updatedAt: true,

            _count: {
              select: {
                listings: true,
              },
            },
          },
        }),

        prisma.user.count({
          where,
        }),
      ]);

    const totalPages = Math.ceil(
      totalCount / limit
    );

    return NextResponse.json({
      users,
      totalCount,
      totalPages,
      page,
      limit,
    });
  } catch (error) {
    console.error(
      "MANAGER_USERS_GET_ERROR",
      error
    );

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}