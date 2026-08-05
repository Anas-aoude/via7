import prisma from "@/app/libs/prismadb";
import getCurrentUser from "../users/getCurrentUser";

interface GetConversationsParams {
  page?: number;
  limit?: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const MAX_PAGE = 10_000;

const toSafePositiveInteger = (
  value: number | undefined,
  fallback: number,
  max: number
) => {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1
  ) {
    return fallback;
  }

  return Math.min(value, max);
};

export default async function getConversations({
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT,
}: GetConversationsParams = {}) {
  const safePage = toSafePositiveInteger(
    page,
    DEFAULT_PAGE,
    MAX_PAGE
  );

  const safeLimit = toSafePositiveInteger(
    limit,
    DEFAULT_LIMIT,
    MAX_LIMIT
  );

  try {
    const currentUser =
      await getCurrentUser();

    if (
      !currentUser ||
      currentUser.isBanned
    ) {
      return {
        conversations: [],
        totalCount: 0,
        totalPages: 1,
        currentPage: safePage,
        limit: safeLimit,
      };
    }

    const skip =
      (safePage - 1) * safeLimit;

    const where = {
      userIds: {
        has: currentUser.id,
      },
    };

    const [conversations, totalCount] =
      await Promise.all([
        prisma.conversation.findMany({
          where,
          skip,
          take: safeLimit,
          orderBy: {
            updatedAt: "desc",
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
                    avatarUrl: true,
                    role: true,
                    isBanned: true,
                  },
                },
              },
            },

            messages: {
              take: 1,
              orderBy: {
                createdAt: "desc",
              },
              select: {
                id: true,
                body: true,
                isRead: true,
                attachmentUrl: true,
                attachmentType: true,
                attachmentName: true,
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
        }),

        prisma.conversation.count({
          where,
        }),
      ]);

    const conversationIds =
      conversations.map(
        (conversation) => conversation.id
      );

    const unreadGroups =
      conversationIds.length > 0
        ? await prisma.message.groupBy({
          by: ["conversationId"],
          where: {
            conversationId: {
              in: conversationIds,
            },
            senderId: {
              not: currentUser.id,
            },
            isRead: false,
          },
          _count: {
            _all: true,
          },
        })
        : [];

    const unreadCountMap = new Map(
      unreadGroups.map((group) => [
        group.conversationId,
        group._count._all,
      ])
    );

    const conversationsWithUnreadCount =
      conversations.map(
        (conversation) => ({
          ...conversation,
          unreadCount:
            unreadCountMap.get(
              conversation.id
            ) ?? 0,
        })
      );

    return {
      conversations:
        conversationsWithUnreadCount,
      totalCount,
      totalPages: Math.max(
        1,
        Math.ceil(
          totalCount / safeLimit
        )
      ),
      currentPage: safePage,
      limit: safeLimit,
    };
  } catch (error) {
    console.error(
      "GET_CONVERSATIONS_ERROR",
      error
    );

    return {
      conversations: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: safePage,
      limit: safeLimit,
    };
  }
}