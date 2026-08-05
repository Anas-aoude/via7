import { NextResponse } from "next/server";

import getCurrentUser from "@/app/actions/users/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { verifyRequestOrigin } from "@/app/libs/security/verifyRequestOrigin";

interface IParams {
  conversationId?: string;
}

interface ConversationRouteProps {
  params: Promise<IParams>;
}

export async function DELETE(
  request: Request,
  { params }: ConversationRouteProps
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

    const resolvedParams = await params;
    const { conversationId } = resolvedParams;

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
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const isParticipant = conversation.userIds.includes(currentUser.id);
    const isAdmin = currentUser.role === "ADMIN";

    if (!isParticipant && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.message.deleteMany({
      where: {
        conversationId,
      },
    });

    await prisma.conversation.delete({
      where: {
        id: conversationId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("[CONVERSATION_DELETE]", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}