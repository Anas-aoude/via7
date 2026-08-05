import prisma from "@/app/libs/prismadb";
import getCurrentUser from "../users/getCurrentUser";

const DAYS_RANGE = 30;
const MONTHS_RANGE = 6;
const LATEST_ITEMS_LIMIT = 5;

const getUtcStartOfDay = (date = new Date()) => {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    )
  );
};

const getLastDays = (days: number): Date[] => {
  const today = getUtcStartOfDay();

  return Array.from(
    { length: days },
    (_, index) => {
      const date = new Date(today);

      date.setUTCDate(
        date.getUTCDate() -
        (days - 1 - index)
      );

      return date;
    }
  );
};

const getLastMonths = (
  months: number
): Date[] => {
  const now = new Date();

  const currentMonth = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      1
    )
  );

  return Array.from(
    { length: months },
    (_, index) => {
      const date = new Date(currentMonth);

      date.setUTCMonth(
        date.getUTCMonth() -
        (months - 1 - index)
      );

      return date;
    }
  );
};

const formatDay = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
};

const formatMonth = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

const getDayKey = (date: Date) => {
  return date.toISOString().slice(0, 10);
};

const getMonthKey = (date: Date) => {
  return date.toISOString().slice(0, 7);
};

export default async function getAccountStats() {
  try {
    const currentUser =
      await getCurrentUser();

    if (
      !currentUser ||
      currentUser.isBanned
    ) {
      return null;
    }

    const listings =
      await prisma.listing.findMany({
        where: {
          userId: currentUser.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          title: true,
          imageUrl: true,
          imageUrls: true,
          price: true,
          purpose: true,
          rentPeriod: true,
          governorate: true,
          city: true,
          viewCount: true,
          favoriteCount: true,
          isActive: true,
          createdAt: true,
          reviews: {
            where: {
              isHidden: false,
            },
            select: {
              rating: true,
            },
          },
        },
      });

    const listingIds = listings.map(
      (listing) => listing.id
    );

    const last30Days =
      getLastDays(DAYS_RANGE);

    const last6Months =
      getLastMonths(MONTHS_RANGE);

    const firstDay =
      last30Days[0];

    const firstMonth =
      last6Months[0];

    const [
      conversationsCount,
      latestConversations,
      latestReviews,
      views,
      reviewsForChart,
    ] = await Promise.all([
      prisma.conversation.count({
        where: {
          userIds: {
            has: currentUser.id,
          },
        },
      }),

      prisma.conversation.findMany({
        where: {
          userIds: {
            has: currentUser.id,
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: LATEST_ITEMS_LIMIT,
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
                },
              },
            },
          },
        },
      }),

      listingIds.length > 0
        ? prisma.review.findMany({
          where: {
            isHidden: false,
            OR: [
              {
                targetId:
                  currentUser.id,
              },
              {
                listingId: {
                  in: listingIds,
                },
              },
            ],
          },
          orderBy: {
            createdAt: "desc",
          },
          take: LATEST_ITEMS_LIMIT,
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
            listing: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        })
        : prisma.review.findMany({
          where: {
            isHidden: false,
            targetId:
              currentUser.id,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: LATEST_ITEMS_LIMIT,
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
            listing: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        }),

      listingIds.length > 0
        ? prisma.listingView.findMany({
          where: {
            listingId: {
              in: listingIds,
            },
            createdAt: {
              gte: firstDay,
            },
          },
          select: {
            createdAt: true,
          },
        })
        : Promise.resolve([]),

      listingIds.length > 0
        ? prisma.review.findMany({
          where: {
            isHidden: false,
            listingId: {
              in: listingIds,
            },
            createdAt: {
              gte: firstMonth,
            },
          },
          select: {
            createdAt: true,
          },
        })
        : Promise.resolve([]),
    ]);

    const allRatings =
      listings.flatMap((listing) =>
        listing.reviews.map(
          (review) => review.rating
        )
      );

    const reviewsCount =
      allRatings.length;

    const averageRating =
      reviewsCount > 0
        ? Number(
          (
            allRatings.reduce(
              (total, rating) =>
                total + rating,
              0
            ) / reviewsCount
          ).toFixed(1)
        )
        : 0;

    const totalViews =
      listings.reduce(
        (total, listing) =>
          total + listing.viewCount,
        0
      );

    const totalFavorites =
      listings.reduce(
        (total, listing) =>
          total +
          listing.favoriteCount,
        0
      );

    const activeListingsCount =
      listings.filter(
        (listing) =>
          listing.isActive
      ).length;

    const averageViewsPerListing =
      listings.length > 0
        ? Number(
          (
            totalViews /
            listings.length
          ).toFixed(1)
        )
        : 0;

    const averageFavoritesPerListing =
      listings.length > 0
        ? Number(
          (
            totalFavorites /
            listings.length
          ).toFixed(1)
        )
        : 0;

    const latestListings =
      listings.slice(
        0,
        LATEST_ITEMS_LIMIT
      );

    const mostViewedListings = [
      ...listings,
    ]
      .sort(
        (a, b) =>
          b.viewCount -
          a.viewCount
      )
      .slice(
        0,
        LATEST_ITEMS_LIMIT
      );

    const bestRatedListings = [
      ...listings,
    ]
      .map((listing) => {
        const ratingCount =
          listing.reviews.length;

        const rating =
          ratingCount > 0
            ? Number(
              (
                listing.reviews.reduce(
                  (
                    total,
                    review
                  ) =>
                    total +
                    review.rating,
                  0
                ) / ratingCount
              ).toFixed(1)
            )
            : 0;

        return {
          ...listing,
          rating,
          ratingCount,
        };
      })
      .filter(
        (listing) =>
          listing.ratingCount > 0
      )
      .sort((a, b) => {
        if (
          b.rating !== a.rating
        ) {
          return (
            b.rating - a.rating
          );
        }

        return (
          b.ratingCount -
          a.ratingCount
        );
      });

    const bestRatedListing =
      bestRatedListings[0] || null;

    const bestPerformingListing =
      [...listings].sort(
        (a, b) => {
          const scoreA =
            a.viewCount * 2 +
            a.favoriteCount * 5 +
            a.reviews.length * 8;

          const scoreB =
            b.viewCount * 2 +
            b.favoriteCount * 5 +
            b.reviews.length * 8;

          return scoreB - scoreA;
        }
      )[0] || null;

    const cityPerformance =
      listings.reduce<
        Record<string, number>
      >((result, listing) => {
        const city =
          listing.city ||
          listing.governorate ||
          "Unknown";

        result[city] =
          (result[city] || 0) +
          listing.viewCount;

        return result;
      }, {});

    const mostViewedCityEntry =
      Object.entries(
        cityPerformance
      ).sort(
        (a, b) => b[1] - a[1]
      )[0];

    const mostViewedCity =
      mostViewedCityEntry
        ? {
          name:
            mostViewedCityEntry[0],
          views:
            mostViewedCityEntry[1],
        }
        : null;

    const revenue = {
      estimated: 0,
      pending: 0,
      completed: 0,
      currency: "USD",
    };

    const viewsByDay =
      views.reduce<
        Record<string, number>
      >((result, view) => {
        const key = getDayKey(
          view.createdAt
        );

        result[key] =
          (result[key] || 0) + 1;

        return result;
      }, {});

    const viewsChart =
      last30Days.map((date) => {
        const key =
          getDayKey(date);

        return {
          date: formatDay(date),
          views:
            viewsByDay[key] || 0,
        };
      });

    const reviewsByMonth =
      reviewsForChart.reduce<
        Record<string, number>
      >((result, review) => {
        const key = getMonthKey(
          review.createdAt
        );

        result[key] =
          (result[key] || 0) + 1;

        return result;
      }, {});

    const listingsByMonth =
      listings.reduce<
        Record<string, number>
      >((result, listing) => {
        const key = getMonthKey(
          listing.createdAt
        );

        result[key] =
          (result[key] || 0) + 1;

        return result;
      }, {});

    const reviewsChart =
      last6Months.map((date) => {
        const key =
          getMonthKey(date);

        return {
          month:
            formatMonth(date),
          reviews:
            reviewsByMonth[key] ||
            0,
        };
      });

    const listingsChart =
      last6Months.map((date) => {
        const key =
          getMonthKey(date);

        return {
          month:
            formatMonth(date),
          listings:
            listingsByMonth[key] ||
            0,
        };
      });

    const topListingsChart =
      mostViewedListings.map(
        (listing) => ({
          title:
            listing.title.length >
              22
              ? `${listing.title.slice(
                0,
                22
              )}...`
              : listing.title,
          views:
            listing.viewCount,
          favorites:
            listing.favoriteCount,
        })
      );

    return {
      listingsCount:
        listings.length,
      activeListingsCount,
      conversationsCount,
      reviewsCount,
      totalViews,
      totalFavorites,
      averageRating,
      averageViewsPerListing,
      averageFavoritesPerListing,
      bestPerformingListing,
      mostViewedCity,
      bestRatedListing,
      revenue,
      latestListings,
      mostViewedListings,
      latestReviews,
      latestConversations,
      viewsChart,
      reviewsChart,
      listingsChart,
      topListingsChart,
    };
  } catch (error) {
    console.error(
      "GET_ACCOUNT_STATS_ERROR",
      error
    );

    return null;
  }
}