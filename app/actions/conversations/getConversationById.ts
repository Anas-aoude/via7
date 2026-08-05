import prisma from "@/app/libs/prismadb";
import getCurrentUser from "../users/getCurrentUser";

interface IParams {
  conversationId?: string;
}

const MESSAGES_LIMIT = 30;

const isValidObjectId = (value: string) => {
  return /^[a-f\d]{24}$/i.test(value);
};

export default async function getConversationById(
  params: IParams
) {
  try {
    const currentUser =
      await getCurrentUser();

    if (
      !currentUser ||
      currentUser.isBanned
    ) {
      return null;
    }

    const conversationId =
      params.conversationId;

    if (
      !conversationId ||
      typeof conversationId !== "string" ||
      !isValidObjectId(conversationId)
    ) {
      return null;
    }

    /*
     * نتحقق من المشاركة داخل الاستعلام نفسه.
     * بهذا لا يتم تحميل محادثة لا يملك المستخدم
     * صلاحية الوصول إليها.
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
          userIds: true,
          listingId: true,
          createdAt: true,
          updatedAt: true,

          listing: {
            select: {
              id: true,
              title: true,
              price: true,
              governorate: true,
              city: true,
              imageUrl: true,
              imageUrls: true,
              isActive: true,

              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                  role: true,
                  isBanned: true,
                },
              },
            },
          },

          messages: {
            orderBy: {
              createdAt: "desc",
            },
            take: MESSAGES_LIMIT,
            select: {
              id: true,
              body: true,
              isRead: true,
              attachmentUrl: true,
              attachmentType: true,
              attachmentName: true,
              seenIds: true,
              conversationId: true,
              senderId: true,
              createdAt: true,

              sender: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                  role: true,
                  isBanned: true,
                },
              },
            },
          },
        },
      });

    if (!conversation) {
      return null;
    }

    return {
      ...conversation,
      messages: [
        ...conversation.messages,
      ].reverse(),
    };
  } catch (error) {
    console.error(
      "GET_CONVERSATION_BY_ID_ERROR",
      error
    );

    return null;
  }
}