import { NextResponse } from "next/server";

import getCurrentUser from "@/app/actions/users/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { CacheManager } from "@/app/services/cache/cache.manager";
import { verifyRequestOrigin } from "@/app/libs/security/verifyRequestOrigin";

export async function PATCH(request: Request) {
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

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phoneNumber =
      typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";
    const avatarUrl =
      typeof body.avatarUrl === "string" ? body.avatarUrl.trim() : "";
    const bio = typeof body.bio === "string" ? body.bio.trim() : "";

    const dateOfBirth =
      typeof body.dateOfBirth === "string" && body.dateOfBirth.trim()
        ? new Date(body.dateOfBirth)
        : null;

    if (dateOfBirth && Number.isNaN(dateOfBirth.getTime())) {
      return NextResponse.json(
        { error: "Invalid date of birth" },
        { status: 400 }
      );
    }

    if (
      name.length > 80 ||
      phoneNumber.length > 30 ||
      avatarUrl.length > 500 ||
      bio.length > 1000
    ) {
      return NextResponse.json(
        { error: "Invalid profile data" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: currentUser.id,
      },
      data: {
        name: name || null,
        phoneNumber: phoneNumber || null,
        dateOfBirth,
        avatarUrl: avatarUrl || null,
        bio: bio || null,
      },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        dateOfBirth: true,
        avatarUrl: true,
        bio: true,
      },
    });

    await CacheManager.invalidateUser(currentUser.id);

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.log("[ACCOUNT_PROFILE_PATCH]", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}