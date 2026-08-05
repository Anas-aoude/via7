import { NextResponse } from "next/server";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/users/getCurrentUser";
import { RateLimitService } from "@/app/services/rate-limit";
import { verifyRequestOrigin } from "@/app/libs/security/verifyRequestOrigin";

export async function POST(request: Request) {
  try {
    const originError = verifyRequestOrigin(request);

      if (originError) {
        return originError;
      }
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.isBanned) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await RateLimitService.reviews(currentUser.id);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many reviews. Please try again later.",
          resetInSeconds: rateLimit.resetInSeconds,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { listingId, rating, comment } = body;

    const normalizedRating = Number(rating);
    const normalizedComment =
      typeof comment === "string" ? comment.trim().slice(0, 1000) : null;

    if (!listingId || typeof listingId !== "string") {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(normalizedRating) ||
      normalizedRating < 1 ||
      normalizedRating > 5
    ) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const listing = await prisma.listing.findUnique({
      where: {
        id: listingId,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    if (listing.userId === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot review your own listing" },
        { status: 400 }
      );
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        authorId: currentUser.id,
        listingId,
      },
      select: {
        id: true,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You already reviewed this listing" },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        rating: normalizedRating,
        comment: normalizedComment || null,
        authorId: currentUser.id,
        targetId: listing.userId,
        listingId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.log("CREATE_REVIEW_ERROR", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}