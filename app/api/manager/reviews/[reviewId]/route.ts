import { NextResponse } from "next/server";
import {
  AuditAction,
  AuditTargetType,
} from "@prisma/client";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/users/getCurrentUser";
import { createAuditLog } from "@/app/libs/auditLog";
import { verifyRequestOrigin } from "@/app/libs/security/verifyRequestOrigin";
import { RateLimitService } from "@/app/services/rate-limit";
import { CacheManager } from "@/app/services/cache/cache.manager";

interface IParams {
  reviewId?: string;
}

const MAX_AUDIT_COMMENT_LENGTH = 200;

const isValidObjectId = (value: string) => {
  return /^[a-f\d]{24}$/i.test(value);
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
    currentUser.role !== "MANAGER" ||
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
      "MANAGER_REVIEW_CACHE_INVALIDATION_ERROR",
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
        key: `manager-update-review:${currentUser.id}`,
        limit: 60,
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
        { error: "Invalid hidden status" },
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
          rating: true,
          comment: true,
          isHidden: true,
          authorId: true,
          targetId: true,
          listingId: true,

          author: {
            select: {
              id: true,
              role: true,
            },
          },

          target: {
            select: {
              id: true,
              role: true,
            },
          },

          listing: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  role: true,
                },
              },
            },
          },
        },
      });

    if (!existingReview) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    const protectedRoles = new Set([
      "ADMIN",
      "MANAGER",
    ]);

    const authorRole =
      existingReview.author?.role;

    const targetRole =
      existingReview.target?.role;

    const listingOwnerRole =
      existingReview.listing?.user.role;

    if (
      (authorRole &&
        protectedRoles.has(authorRole)) ||
      (targetRole &&
        protectedRoles.has(targetRole)) ||
      (listingOwnerRole &&
        protectedRoles.has(listingOwnerRole))
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    if (
      existingReview.isHidden === isHidden
    ) {
      return NextResponse.json({
        id: existingReview.id,
        isHidden:
          existingReview.isHidden,
        unchanged: true,
      });
    }

    const review =
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
          comment: true,
          isHidden: true,
          authorId: true,
          targetId: true,
          listingId: true,
          updatedAt: true,
        },
      });

    try {
      await createAuditLog({
        userId: currentUser.id,
        action: review.isHidden
          ? AuditAction.MANAGER_HIDE_REVIEW
          : AuditAction.MANAGER_UNHIDE_REVIEW,
        targetType:
          AuditTargetType.REVIEW,
        targetId: review.id,
        metadata: {
          rating: review.rating,

          /*
           * لا نخزن التعليق كاملًا داخل Audit Log.
           */
          commentPreview:
            review.comment
              ?.trim()
              .slice(
                0,
                MAX_AUDIT_COMMENT_LENGTH
              ) || null,

          previousIsHidden:
            existingReview.isHidden,
          newIsHidden: review.isHidden,
          authorId: review.authorId,
          targetId: review.targetId,
          listingId: review.listingId,
        },
      });
    } catch (auditError) {
      console.error(
        "MANAGER_REVIEW_AUDIT_ERROR",
        auditError
      );
    }

    await invalidateReviewCaches(
      review.listingId
    );

    return NextResponse.json(review);
  } catch (error) {
    console.error(
      "MANAGER_REVIEW_PATCH_ERROR",
      error
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}