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

    const rateLimit = await RateLimitService.messages(currentUser.id);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many messages. Please slow down." },
        { status: 429 }
      );
    }

    const body = await request.json();

    const conversationId =
      typeof body.conversationId === "string"
        ? body.conversationId.trim()
        : "";

    const messageBody =
      typeof body.body === "string" ? body.body.trim() : "";

    const attachmentUrl =
      typeof body.attachmentUrl === "string"
        ? body.attachmentUrl.trim()
        : "";

    const attachmentType =
      typeof body.attachmentType === "string"
        ? body.attachmentType.trim()
        : "";

    const attachmentName =
      typeof body.attachmentName === "string"
        ? body.attachmentName.trim()
        : "";

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    if (!messageBody && !attachmentUrl) {
      return NextResponse.json(
        { error: "Message or attachment is required" },
        { status: 400 }
      );
    }

    if (messageBody.length > 5000) {
      return NextResponse.json(
        { error: "Message is too long" },
        { status: 400 }
      );
    }

    if (
      attachmentUrl.length > 1000 ||
      attachmentType.length > 100 ||
      attachmentName.length > 255
    ) {
      return NextResponse.json(
        { error: "Invalid attachment" },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (!conversation.userIds.includes(currentUser.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const receiverId = conversation.userIds.find(
      (userId) => userId !== currentUser.id
    );

    if (receiverId && currentUser.blockedUserIds.includes(receiverId)) {
      return NextResponse.json(
        { error: "You blocked this user" },
        { status: 403 }
      );
    }

    if (receiverId) {
      const receiver = await prisma.user.findUnique({
        where: {
          id: receiverId,
        },
        select: {
          blockedUserIds: true,
          isBanned: true,
        },
      });

      if (!receiver || receiver.isBanned) {
        return NextResponse.json(
          { error: "Receiver is not available" },
          { status: 403 }
        );
      }

      if (receiver.blockedUserIds.includes(currentUser.id)) {
        return NextResponse.json(
          { error: "You cannot message this user" },
          { status: 403 }
        );
      }
    }

    const newMessage = await prisma.message.create({
      data: {
        body: messageBody,
        conversationId,
        senderId: currentUser.id,
        attachmentUrl: attachmentUrl || null,
        attachmentType: attachmentType || null,
        attachmentName: attachmentName || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    await prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      ...newMessage,
      receiverId,
    });
  } catch (error) {
    console.log("[MESSAGES_POST]", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}