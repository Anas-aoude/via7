import { NextResponse } from "next/server";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/users/getCurrentUser";

interface IParams {
  conversationId?: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<IParams> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.isBanned) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);

    const beforeMessageId = searchParams.get("beforeMessageId");
    const limit = Math.min(Number(searchParams.get("limit")) || 30, 50);

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      select: {
        id: true,
        userIds: true,
      },
    });

    if (!conversation || !conversation.userIds.includes(currentUser.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const beforeMessage = beforeMessageId
      ? await prisma.message.findUnique({
        where: {
          id: beforeMessageId,
        },
        select: {
          createdAt: true,
          conversationId: true,
        },
      })
      : null;

    if (
      beforeMessageId &&
      (!beforeMessage || beforeMessage.conversationId !== conversationId)
    ) {
      return NextResponse.json(
        { error: "Invalid message cursor" },
        { status: 400 }
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        ...(beforeMessage
          ? {
            createdAt: {
              lt: beforeMessage.createdAt,
            },
          }
          : {}),
      },
      take: limit,
      include: {
        sender: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    messages.reverse();

    return NextResponse.json({
      messages,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.log("[GET_OLDER_MESSAGES]", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}