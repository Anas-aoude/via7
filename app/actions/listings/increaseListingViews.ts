import { Prisma } from "@prisma/client";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/users/getCurrentUser";
import { CacheManager } from "@/app/services/cache/cache.manager";

const isValidObjectId = (value: string) => {
  return /^[a-f\d]{24}$/i.test(value);
};

const invalidateViewCaches = async (
  listingId: string
) => {
  const results = await Promise.allSettled([
    CacheManager.invalidateListing(listingId),
    CacheManager.invalidateHomepage(),
    CacheManager.invalidateSearch(),
  ]);

  const failedResults = results.filter(
    (result) => result.status === "rejected"
  );

  if (failedResults.length > 0) {
    console.error(
      "LISTING_VIEW_CACHE_INVALIDATION_ERROR",
      failedResults
    );
  }
};

export default async function increaseListingViews(
  listingId: string
) {
  try {
    if (
      typeof listingId !== "string" ||
      !isValidObjectId(listingId)
    ) {
      return {
        success: false,
        incremented: false,
      };
    }

    const currentUser =
      await getCurrentUser();

    if (
      !currentUser ||
      currentUser.isBanned
    ) {
      return {
        success: false,
        incremented: false,
      };
    }

    const listing =
      await prisma.listing.findFirst({
        where: {
          id: listingId,
          isActive: true,

          user: {
            is: {
              isBanned: false,
            },
          },
        },
        select: {
          id: true,
          userId: true,
        },
      });

    if (!listing) {
      return {
        success: false,
        incremented: false,
      };
    }

    /*
     * لا نحسب مشاهدة صاحب الإعلان لإعلانه.
     */
    if (listing.userId === currentUser.id) {
      return {
        success: true,
        incremented: false,
      };
    }

    /*
     * يوجد @@unique([userId, listingId])
     * لذلك قاعدة البيانات تمنع تسجيل المشاهدة مرتين.
     */
    await prisma.$transaction([
      prisma.listingView.create({
        data: {
          userId: currentUser.id,
          listingId,
        },
      }),

      prisma.listing.update({
        where: {
          id: listingId,
        },
        data: {
          viewCount: {
            increment: 1,
          },
        },
        select: {
          id: true,
        },
      }),
    ]);

    await invalidateViewCaches(listingId);

    return {
      success: true,
      incremented: true,
    };
  } catch (error) {
    /*
     * P2002 يعني أن نفس المستخدم شاهد الإعلان سابقًا.
     * هذه ليست مشكلة، ولا نزيد العداد مرة ثانية.
     */
    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: true,
        incremented: false,
      };
    }

    /*
     * الإعلان قد يكون حُذف بين فحصه وعملية update.
     */
    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return {
        success: false,
        incremented: false,
      };
    }

    console.error(
      "INCREASE_UNIQUE_VIEW_ERROR",
      error
    );

    return {
      success: false,
      incremented: false,
    };
  }
}