import { NextResponse } from "next/server";

import getCurrentUser from "@/app/actions/users/getCurrentUser";
import prisma from "@/app/libs/prismadb";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ count: 0 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        userIds: {
          has: currentUser.id,
        },
      },
      select: {
        id: true,
      },
    });

    const conversationIds = conversations.map((conversation) => conversation.id);

    if (conversationIds.length === 0) {
      return NextResponse.json({ count: 0 });
    }

    const count = await prisma.message.count({
      where: {
        conversationId: {
          in: conversationIds,
        },
        senderId: {
          not: currentUser.id,
        },
        isRead: false,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.log("[UNREAD_COUNT_GET]", error);

    return NextResponse.json({ count: 0 });
  }
}