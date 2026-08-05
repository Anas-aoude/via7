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
        { error: "Your account is banned" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const userId =
      typeof body.userId === "string" ? body.userId.trim() : "";

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: {
        id: currentUser.id,
      },
      data: {
        blockedUserIds: currentUser.blockedUserIds.filter(
          (id) => id !== userId
        ),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("[UNBLOCK_USER_POST]", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}