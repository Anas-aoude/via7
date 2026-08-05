import { NextResponse } from "next/server";
import {
  AuditAction,
  AuditTargetType,
  UserRole,
} from "@prisma/client";

import prisma from "@/app/libs/prismadb";
import { createAuditLog } from "@/app/libs/auditLog";
import getCurrentUser from "@/app/actions/users/getCurrentUser";
import { CacheManager } from "@/app/services/cache/cache.manager";
import { verifyRequestOrigin } from "@/app/libs/security/verifyRequestOrigin";
import { RateLimitService } from "@/app/services/rate-limit";

interface IParams {
  listingId?: string;
}

const isValidObjectId = (value: string) => {
  return /^[a-f\d]{24}$/i.test(value);
};

const ALLOWED_OWNER_ROLES: UserRole[] = [
  UserRole.USER,
  UserRole.HOST,
  UserRole.VIP_HOST,
  UserRole.AGENCY,
];

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

const invalidateListingCaches = async (
  listingId: string
) => {
  const results = await Promise.allSettled([
    CacheManager.invalidateHomepage(),
    CacheManager.invalidateListing(listingId),
    CacheManager.invalidateSearch(),
  ]);

  const failedResults = results.filter(
    (result) => result.status === "rejected"
  );

  if (failedResults.length > 0) {
    console.error(
      "MANAGER_CHANGE_OWNER_CACHE_INVALIDATION_ERROR",
      failedResults
    );
  }
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<IParams> }
) {
  try {
    const originError = verifyRequestOrigin(request);

      if (originError) {
        return originError;
      }

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
        key: `manager-change-listing-owner:${currentUser.id}`,
        limit: 20,
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

    const { listingId } = await params;

    if (
      !listingId ||
      !isValidObjectId(listingId)
    ) {
      return NextResponse.json(
        { error: "Invalid listing id" },
        { status: 400 }
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

    if (
      typeof body.newOwnerId !== "string" ||
      !isValidObjectId(body.newOwnerId)
    ) {
      return NextResponse.json(
        { error: "Invalid owner id" },
        { status: 400 }
      );
    }

    const newOwnerId = body.newOwnerId;

    const [listing, newOwner] =
      await Promise.all([
        prisma.listing.findUnique({
          where: {
            id: listingId,
          },
          select: {
            id: true,
            title: true,
            userId: true,
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

        prisma.user.findUnique({
          where: {
            id: newOwnerId,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isBanned: true,
          },
        }),
      ]);

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    /*
     * Manager darf:
     *
     * - eigene Manager-Listings übertragen
     * - Listings von USER / HOST / VIP_HOST / AGENCY übertragen
     *
     * Manager darf NICHT:
     * - Listings eines anderen Managers übertragen
     * - Admin-Listings übertragen
     */
    if (
      listing.user.role === UserRole.ADMIN
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    if (
      listing.user.role === UserRole.MANAGER &&
      listing.userId !== currentUser.id
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    if (!newOwner) {
      return NextResponse.json(
        { error: "New owner not found" },
        { status: 404 }
      );
    }

    if (newOwner.isBanned) {
      return NextResponse.json(
        { error: "New owner is banned" },
        { status: 400 }
      );
    }

    if (
      !ALLOWED_OWNER_ROLES.includes(
        newOwner.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid new owner role",
        },
        { status: 400 }
      );
    }

    if (
      listing.userId === newOwner.id
    ) {
      return NextResponse.json(
        {
          error:
            "User is already the listing owner",
        },
        { status: 400 }
      );
    }

    const updatedListing =
      await prisma.listing.update({
        where: {
          id: listing.id,
        },
        data: {
          userId: newOwner.id,
        },
        select: {
          id: true,
          title: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

    await createAuditLog({
      userId: currentUser.id,
      action:
        AuditAction.MANAGER_CHANGE_LISTING_OWNER,
      targetType:
        AuditTargetType.LISTING,
      targetId: listing.id,
      metadata: {
        title: listing.title,

        previousOwnerId:
          listing.user.id,
        previousOwnerName:
          listing.user.name,
        previousOwnerEmail:
          listing.user.email,
        previousOwnerRole:
          listing.user.role,

        newOwnerId:
          newOwner.id,
        newOwnerName:
          newOwner.name,
        newOwnerEmail:
          newOwner.email,
        newOwnerRole:
          newOwner.role,
      },
    });

    await invalidateListingCaches(
      listing.id
    );

    return NextResponse.json(
      updatedListing
    );
  } catch (error) {
    console.error(
      "MANAGER_CHANGE_LISTING_OWNER_ERROR",
      error
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}