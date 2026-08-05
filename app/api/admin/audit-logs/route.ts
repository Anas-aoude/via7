import { NextResponse } from "next/server";
import {
  AuditAction,
  AuditTargetType,
  Prisma,
} from "@prisma/client";

import getCurrentUser from "@/app/actions/users/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { RateLimitService } from "@/app/services/rate-limit";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
const MAX_PAGE = 1_000;
const MAX_SEARCH_LENGTH = 100;

const isObjectId = (value: string) =>
  /^[a-f\d]{24}$/i.test(value);

const toSafePositiveInt = (
  value: string | null,
  fallback: number,
  max: number
) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, max);
};

async function requireAdmin() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      user: null,
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
      user: null,
      response: NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return {
    user: currentUser,
    response: null,
  };
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();

    if (auth.response || !auth.user) {
      return auth.response;
    }

    const currentUser = auth.user;

    const rateLimit = await RateLimitService.check({
      key: `admin-audit-logs:${currentUser.id}`,
      limit: 120,
      windowSeconds: 60 * 60,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many requests",
          resetInSeconds: rateLimit.resetInSeconds,
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);

    const page = toSafePositiveInt(
      searchParams.get("page"),
      1,
      MAX_PAGE
    );

    const limit = toSafePositiveInt(
      searchParams.get("limit"),
      DEFAULT_LIMIT,
      MAX_LIMIT
    );

    const search =
      searchParams.get("search")?.trim() || "";

    if (search.length > MAX_SEARCH_LENGTH) {
      return NextResponse.json(
        { error: "Search query is too long" },
        { status: 400 }
      );
    }

    const action = searchParams.get("action");
    const targetType = searchParams.get("targetType");

    if (
      action &&
      !Object.values(AuditAction).includes(
        action as AuditAction
      )
    ) {
      return NextResponse.json(
        { error: "Invalid audit action" },
        { status: 400 }
      );
    }

    if (
      targetType &&
      !Object.values(AuditTargetType).includes(
        targetType as AuditTargetType
      )
    ) {
      return NextResponse.json(
        { error: "Invalid audit target type" },
        { status: 400 }
      );
    }

    const safeAction = action as AuditAction | null;
    const safeTargetType =
      targetType as AuditTargetType | null;

    const searchConditions: Prisma.AuditLogWhereInput[] =
      search
        ? [
          ...(isObjectId(search)
            ? [
              {
                userId: search,
              },
              {
                targetId: search,
              },
            ]
            : []),
          {
            user: {
              is: {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            user: {
              is: {
                email: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },
          ...(Object.values(AuditAction).includes(
            search as AuditAction
          )
            ? [
              {
                action: search as AuditAction,
              },
            ]
            : []),
        ]
        : [];

    const where: Prisma.AuditLogWhereInput = {
      ...(safeAction
        ? { action: safeAction }
        : {}),
      ...(safeTargetType
        ? { targetType: safeTargetType }
        : {}),
      ...(searchConditions.length
        ? { OR: searchConditions }
        : {}),
    };

    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          action: true,
          targetType: true,
          targetId: true,
          metadata: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error(
      "ADMIN_AUDIT_LOGS_GET_ERROR",
      error
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}