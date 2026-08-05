import prisma from "@/app/libs/prismadb";

export default async function getReviewsByListingId(listingId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        listingId,
        isHidden: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return reviews;
  } catch (error) {
    console.log("GET_LISTING_REVIEWS_ERROR", error);
    return [];
  }
}