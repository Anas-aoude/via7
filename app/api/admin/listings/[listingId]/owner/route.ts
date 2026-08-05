import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/users/getCurrentUser";
import { CacheManager } from "@/app/services/cache/cache.manager";
import { RateLimitService } from "@/app/services/rate-limit";
import { verifyRequestOrigin } from "@/app/libs/security/verifyRequestOrigin";

interface IParams {
  listingId?: string;
}

const isValidObjectId = (value: string) => {
  return /^[a-f\d]{24}$/i.test(value);
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
    currentUser.role !== UserRole.ADMIN ||
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
      "ADMIN_CHANGE_OWNER_CACHE_INVALIDATION_ERROR",
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
        key: `admin-change-listing-owner:${currentUser.id}`,
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

    const { listingId } = await params;

    if (
      !listingId ||
      typeof listingId !== "string" ||
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
            phoneNumber: true,
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
              phoneNumber: true,
              role: true,
            },
          },
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
      "ADMIN_CHANGE_LISTING_OWNER_ERROR",
      error
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}