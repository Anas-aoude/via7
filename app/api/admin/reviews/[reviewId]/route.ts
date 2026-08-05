import { NextResponse } from "next/server";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/users/getCurrentUser";
import { verifyRequestOrigin } from "@/app/libs/security/verifyRequestOrigin";
import { RateLimitService } from "@/app/services/rate-limit";
import { CacheManager } from "@/app/services/cache/cache.manager";

interface IParams {
  reviewId?: string;
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

const invalidateReviewCaches = async (
  listingId: string | null
) => {
  if (!listingId) {
    return;
  }

  const results = await Promise.allSettled([
    CacheManager.invalidateListing(listingId),
    CacheManager.invalidateHomepage(),
    CacheManager.invalidateSearch(),
  ]);

  const failedResults = results.filter(
    (result) => result.status === "rejected"
  );

  if (failedResults.length > 0) {
    console.error(
      "ADMIN_REVIEW_CACHE_INVALIDATION_ERROR",
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
        key: `admin-review-update:${currentUser.id}`,
        limit: 120,
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

    const { reviewId } = await params;

    if (
      !reviewId ||
      typeof reviewId !== "string" ||
      !isValidObjectId(reviewId)
    ) {
      return NextResponse.json(
        { error: "Invalid review id" },
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
      typeof body.isHidden !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Invalid hidden value" },
        { status: 400 }
      );
    }

    const isHidden = body.isHidden;

    const existingReview =
      await prisma.review.findUnique({
        where: {
          id: reviewId,
        },
        select: {
          id: true,
          isHidden: true,
          authorId: true,
          targetId: true,
          listingId: true,
          rating: true,
        },
      });

    if (!existingReview) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    if (
      existingReview.isHidden === isHidden
    ) {
      return NextResponse.json({
        id: existingReview.id,
        isHidden: existingReview.isHidden,
        unchanged: true,
      });
    }

    const updatedReview =
      await prisma.review.update({
        where: {
          id: reviewId,
        },
        data: {
          isHidden,
        },
        select: {
          id: true,
          rating: true,
          isHidden: true,
          authorId: true,
          targetId: true,
          listingId: true,
          updatedAt: true,
        },
      });



    await invalidateReviewCaches(
      updatedReview.listingId
    );

    return NextResponse.json(
      updatedReview
    );
  } catch (error) {
    console.error(
      "ADMIN_REVIEW_PATCH_ERROR",
      error
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
        key: `admin-review-delete:${currentUser.id}`,
        limit: 40,
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

    const { reviewId } = await params;

    if (
      !reviewId ||
      typeof reviewId !== "string" ||
      !isValidObjectId(reviewId)
    ) {
      return NextResponse.json(
        { error: "Invalid review id" },
        { status: 400 }
      );
    }

    const existingReview =
      await prisma.review.findUnique({
        where: {
          id: reviewId,
        },
        select: {
          id: true,
          authorId: true,
          targetId: true,
          listingId: true,
          rating: true,
          isHidden: true,
        },
      });

    if (!existingReview) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    await prisma.review.delete({
      where: {
        id: reviewId,
      },
    });

    await invalidateReviewCaches(
      existingReview.listingId
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "ADMIN_REVIEW_DELETE_ERROR",
      error
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}