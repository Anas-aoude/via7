import prisma from "@/app/libs/prismadb";
import getCurrentUser from "../users/getCurrentUser";

interface IParams {
  conversationId?: string;
}

const isValidObjectId = (value: string) => {
  return /^[a-f\d]{24}$/i.test(value);
};

export default async function markConversationAsRead(
  params: IParams
) {
  try {
    const currentUser =
      await getCurrentUser();

    if (
      !currentUser ||
      currentUser.isBanned
    ) {
      return {
        success: false,
        updatedCount: 0,
      };
    }

    const conversationId =
      params.conversationId;

    if (
      !conversationId ||
      typeof conversationId !== "string" ||
      !isValidObjectId(conversationId)
    ) {
      return {
        success: false,
        updatedCount: 0,
      };
    }

    /*
     * التحقق من أن المستخدم مشارك في المحادثة
     * يتم داخل الاستعلام نفسه.
     */
    const conversation =
      await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userIds: {
            has: currentUser.id,
          },
        },
        select: {
          id: true,
        },
      });

    if (!conversation) {
      return {
        success: false,
        updatedCount: 0,
      };
    }

    const result =
      await prisma.message.updateMany({
        where: {
          conversationId,
          senderId: {
            not: currentUser.id,
          },
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

    return {
      success: true,
      updatedCount: result.count,
    };
  } catch (error) {
    console.error(
      "MARK_CONVERSATION_AS_READ_ERROR",
      error
    );

    return {
      success: false,
      updatedCount: 0,
    };
  }
}