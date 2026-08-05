import { cache } from "react";
import { getServerSession } from "next-auth/next";
import { unstable_rethrow } from "next/navigation";

import prisma from "@/app/libs/prismadb";
import { authOptions } from "@/app/libs/authOptions";

export const getSession = cache(async () => {
  return getServerSession(authOptions);
});

const getCurrentUser = cache(async () => {
  try {
    const session = await getSession();

    const email = session?.user?.email
      ?.trim()
      .toLowerCase();

    if (!email) {
      return null;
    }

    const currentUser = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        avatarUrl: true,
        phoneNumber: true,
        dateOfBirth: true,
        bio: true,
        role: true,
        isBanned: true,
        credits: true,
        favoriteIds: true,
        blockedUserIds: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return currentUser;
  } catch (error) {
    unstable_rethrow(error);

    console.error(
      "GET_CURRENT_USER_ERROR",
      error
    );

    return null;
  }
});

export default getCurrentUser;