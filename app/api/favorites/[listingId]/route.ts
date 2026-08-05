import { NextResponse } from "next/server";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/users/getCurrentUser";
import { CacheManager } from "@/app/services/cache/cache.manager";
import { verifyRequestOrigin } from "@/app/libs/security/verifyRequestOrigin";

interface IParams {
  listingId?: string;
}

async function syncFavoriteCount(listingId: string) {
  const count = await prisma.user.count({
    where: {
      favoriteIds: {
        has: listingId,
      },
    },
  });

  await prisma.listing.update({
    where: {
      id: listingId,
    },
    data: {
      favoriteCount: count,
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<IParams> }
) {
  try {
    const originError = verifyRequestOrigin(request);

      if (originError) {
        return originError;
      }
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (currentUser.isBanned) {
      return NextResponse.json(
        { error: "Your account is banned" },
        { status: 403 }
      );
    }

    const { listingId } = await params;

    if (!listingId || typeof listingId !== "string") {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: {
        id: listingId,
      },
      select: {
        id: true,
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    const favoriteIds = currentUser.favoriteIds || [];

    if (!favoriteIds.includes(listingId)) {
      await prisma.user.update({
        where: {
          id: currentUser.id,
        },
        data: {
          favoriteIds: {
            push: listingId,
          },
        },
      });
    }

    await syncFavoriteCount(listingId);

    await CacheManager.invalidateUser(currentUser.id);
    await CacheManager.invalidateListing(listingId);
    await CacheManager.invalidateHomepage();
    await CacheManager.invalidateSearch();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("FAVORITE_POST_ERROR", error);

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
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (currentUser.isBanned) {
      return NextResponse.json(
        { error: "Your account is banned" },
        { status: 403 }
      );
    }
    const { listingId } = await params;

    if (!listingId || typeof listingId !== "string") {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: {
        id: listingId,
      },
      select: {
        id: true,
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    const favoriteIds = currentUser.favoriteIds || [];

    if (favoriteIds.includes(listingId)) {
      await prisma.user.update({
        where: {
          id: currentUser.id,
        },
        data: {
          favoriteIds: favoriteIds.filter((id) => id !== listingId),
        },
      });
    }

    await syncFavoriteCount(listingId);

    await CacheManager.invalidateUser(currentUser.id);
    await CacheManager.invalidateListing(listingId);
    await CacheManager.invalidateHomepage();
    await CacheManager.invalidateSearch();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("FAVORITE_DELETE_ERROR", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}