import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import {
  Prisma,
  UserRole,
} from "@prisma/client";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/users/getCurrentUser";
import { RateLimitService } from "@/app/services/rate-limit";
import { verifyRequestOrigin } from "@/app/libs/security/verifyRequestOrigin";

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 100;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MAX_PAGE = 10_000;
const MAX_SEARCH_LENGTH = 100;

const allowedRoles: UserRole[] = [
  "USER",
  "HOST",
  "VIP_HOST",
  "AGENCY",
  "MANAGER",
  "ADMIN",
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

const cleanText = (
  value: unknown,
  maxLength: number
) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
};

const isValidEmail = (email: string) => {
  if (
    !email ||
    email.length > MAX_EMAIL_LENGTH
  ) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
};

const parseBoolean = (
  value: unknown
): boolean | null => {
  if (value === true) {
    return true;
  }

  if (value === false) {
    return false;
  }

  return null;
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

    if (
      auth.response ||
      !auth.currentUser
    ) {
      return auth.response;
    }

    const currentUser = auth.currentUser;

    const rateLimit =
      await RateLimitService.check({
        key: `admin-users-get:${currentUser.id}`,
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
        !allowedRoles.includes(
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
      ...(role
        ? {
          role,
        }
        : {
          role: {
            in: allowedRoles,
          },
        }),

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
      "ADMIN_USERS_GET_ERROR",
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

export async function POST(request: Request) {
  try {
    const originError = verifyRequestOrigin(request);

      if (originError) {
        return originError;
      }

    const auth = await requireAdmin();

    if (
      auth.response ||
      !auth.currentUser
    ) {
      return auth.response;
    }

    const currentUser = auth.currentUser;

    const rateLimit =
      await RateLimitService.check({
        key: `admin-create-user:${currentUser.id}`,
        limit: 30,
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

    let rawBody: unknown;

    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (
      !rawBody ||
      typeof rawBody !== "object" ||
      Array.isArray(rawBody)
    ) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const body = rawBody as Record<
      string,
      unknown
    >;

    if (typeof body.email !== "string") {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 400 }
      );
    }

    if (
      typeof body.password !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 400 }
      );
    }

    const name =
      typeof body.name === "undefined" ||
        body.name === null
        ? ""
        : cleanText(
          body.name,
          MAX_NAME_LENGTH
        );

    if (
      typeof body.name !== "undefined" &&
      body.name !== null &&
      typeof body.name !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid name" },
        { status: 400 }
      );
    }

    const email = cleanText(
      body.email,
      MAX_EMAIL_LENGTH
    ).toLowerCase();

    const password = body.password;

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 400 }
      );
    }

    if (
      password.length <
      MIN_PASSWORD_LENGTH ||
      password.length >
      MAX_PASSWORD_LENGTH
    ) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 400 }
      );
    }

    let role: UserRole = "USER";

    if (typeof body.role !== "undefined") {
      if (
        typeof body.role !== "string" ||
        !allowedRoles.includes(
          body.role as UserRole
        )
      ) {
        return NextResponse.json(
          { error: "Invalid role" },
          { status: 400 }
        );
      }

      role = body.role as UserRole;
    }

    let isBanned = false;

    if (
      typeof body.isBanned !== "undefined"
    ) {
      const parsedIsBanned = parseBoolean(
        body.isBanned
      );

      if (parsedIsBanned === null) {
        return NextResponse.json(
          { error: "Invalid banned value" },
          { status: 400 }
        );
      }

      isBanned = parsedIsBanned;
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword =
      await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        hashedPassword,
        role,
        isBanned,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      user,
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    console.error(
      "ADMIN_USER_CREATE_ERROR",
      error
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}