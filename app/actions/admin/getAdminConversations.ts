import prisma from "@/app/libs/prismadb";
import getCurrentUser from "../users/getCurrentUser";

interface GetAdminConversationsParams {
  page?: number;
  limit?: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
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

export default async function getAdminConversations({
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT,
}: GetAdminConversationsParams = {}) {
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
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return {
        conversations: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: safePage,
        limit: safeLimit,
      };
    }

    if (
      currentUser.role !== "ADMIN" ||
      currentUser.isBanned
    ) {
      return {
        conversations: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: safePage,
        limit: safeLimit,
      };
    }

    const skip =
      (safePage - 1) * safeLimit;

    const [conversations, totalCount] =
      await Promise.all([
        prisma.conversation.findMany({
          orderBy: {
            updatedAt: "desc",
          },
          skip,
          take: safeLimit,
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
                imageUrl: true,
                imageUrls: true,

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
              take: 1,
              select: {
                id: true,
                body: true,
                isRead: true,
                attachmentUrl: true,
                attachmentType: true,
                attachmentName: true,
                seenIds: true,
                senderId: true,
                createdAt: true,

                sender: {
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
          },
        }),

        prisma.conversation.count(),
      ]);

    return {
      conversations,
      totalCount,
      totalPages: Math.ceil(
        totalCount / safeLimit
      ),
      currentPage: safePage,
      limit: safeLimit,
    };
  } catch (error) {
    console.error(
      "GET_ADMIN_CONVERSATIONS_ERROR",
      error
    );

    return {
      conversations: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: safePage,
      limit: safeLimit,
    };
  }
}