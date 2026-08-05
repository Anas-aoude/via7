import { NextResponse } from "next/server";

import getCurrentUser from "@/app/actions/users/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { CacheManager } from "@/app/services/cache/cache.manager";
import { verifyRequestOrigin } from "@/app/libs/security/verifyRequestOrigin";
import { AuditAction, AuditTargetType } from "@prisma/client";
import { createAuditLog } from "@/app/libs/auditLog";

interface IParams {
  listingId?: string;
}

interface ListingRouteProps {
  params: Promise<IParams>;
}

export async function PATCH(request: Request, { params }: ListingRouteProps) {
  try {
    const originError = verifyRequestOrigin(request);

      if (originError) {
        return originError;
      }
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.isBanned) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listingId } = await params;

    if (!listingId || typeof listingId !== "string") {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        userId: true,
        isActive: true,
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const isOwner = listing.userId === currentUser.id;
    const isAdmin = currentUser.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: {
        isActive: !listing.isActive,
      },
    });

    await createAuditLog({
      userId: currentUser.id,
      action: AuditAction.SET_ACTIVE,
      targetType: AuditTargetType.LISTING,
      targetId: updatedListing.id,
      metadata: {
        isActive: updatedListing.isActive,
        previousIsActive: listing.isActive,
        editedByRole: currentUser.role,
      },
    });

    await CacheManager.invalidateHomepage();
    await CacheManager.invalidateListing(listingId);
    await CacheManager.invalidateSearch();

    return NextResponse.json(updatedListing);
  } catch (error) {
    console.log("[ACCOUNT_LISTING_PATCH]", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: ListingRouteProps) {
  try {
    const originError = verifyRequestOrigin(request);

      if (originError) {
        return originError;
      }
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.isBanned) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listingId } = await params;

    if (!listingId || typeof listingId !== "string") {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        userId: true,
        title: true,
        price: true,
        governorate: true,
        city: true,
        category: true,
        type: true,
        purpose: true,
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const isOwner = listing.userId === currentUser.id;
    const isAdmin = currentUser.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        listingId,
      },
      select: {
        id: true,
      },
    });

    const conversationIds = conversations.map((conversation) => conversation.id);

    await prisma.$transaction([
      ...(conversationIds.length > 0
        ? [
          prisma.message.deleteMany({
            where: {
              conversationId: {
                in: conversationIds,
              },
            },
          }),
          prisma.conversation.deleteMany({
            where: {
              id: {
                in: conversationIds,
              },
            },
          }),
        ]
        : []),

      prisma.review.deleteMany({
        where: {
          listingId,
        },
      }),

      prisma.listingView.deleteMany({
        where: {
          listingId,
        },
      }),

      prisma.listing.delete({
        where: {
          id: listingId,
        },
      }),
    ]);

    await createAuditLog({
      userId: currentUser.id,
      action: AuditAction.DELETE_LISTING,
      targetType: AuditTargetType.LISTING,
      targetId: listing.id,
      metadata: {
        title: listing.title,
        price: listing.price,
        governorate: listing.governorate,
        city: listing.city,
        category: listing.category,
        type: listing.type,
        purpose: listing.purpose,
        deletedByRole: currentUser.role,
      },
    });

    await CacheManager.invalidateHomepage();
    await CacheManager.invalidateListing(listingId);
    await CacheManager.invalidateSearch();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("[ACCOUNT_LISTING_DELETE]", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}