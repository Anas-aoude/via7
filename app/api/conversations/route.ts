import { NextResponse } from "next/server";

import getCurrentUser from "@/app/actions/users/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { verifyRequestOrigin } from "@/app/libs/security/verifyRequestOrigin";

export async function POST(request: Request) {
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
        { error: "Banned users cannot start conversations" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const listingId =
      typeof body.listingId === "string" ? body.listingId.trim() : "";

    if (!listingId) {
      return NextResponse.json(
        { error: "Listing ID is required" },
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
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.userId === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot contact yourself" },
        { status: 400 }
      );
    }

    const owner = await prisma.user.findUnique({
      where: {
        id: listing.userId,
      },
      select: {
        id: true,
        blockedUserIds: true,
      },
    });

    if (!owner) {
      return NextResponse.json({ error: "Owner not found" }, { status: 404 });
    }

    const currentUserBlockedOwner =
      currentUser.blockedUserIds.includes(owner.id);

    const ownerBlockedCurrentUser =
      owner.blockedUserIds.includes(currentUser.id);

    if (currentUserBlockedOwner || ownerBlockedCurrentUser) {
      return NextResponse.json(
        { error: "You cannot start a conversation with this user" },
        { status: 403 }
      );
    }

    const existingConversation = await prisma.conversation.findFirst({
      where: {
        listingId,
        userIds: {
          hasEvery: [currentUser.id, listing.userId],
        },
      },
      select: {
        id: true,
        listingId: true,
        userIds: true,
        createdAt: true,
      },
    });

    if (existingConversation) {
      return NextResponse.json({
        success: true,
        conversation: existingConversation,
      });
    }

    const conversation = await prisma.conversation.create({
      data: {
        listingId,
        userIds: [currentUser.id, listing.userId],
      },
      select: {
        id: true,
        listingId: true,
        userIds: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.log("[CONVERSATIONS_POST]", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}