import { Prisma } from "@prisma/client";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "../users/getCurrentUser";

interface IParams {
  listingId?: string;
}

const isValidObjectId = (value: string) => {
  return /^[a-f\d]{24}$/i.test(value);
};

const listingForEditSelect = {
  id: true,
  userId: true,
  title: true,
  description: true,
  price: true,

  governorate: true,
  city: true,
  district: true,
  street: true,
  address: true,

  latitude: true,
  longitude: true,

  category: true,
  type: true,
  purpose: true,
  rentPeriod: true,
  availableFrom: true,

  guestCount: true,
  bedroomCount: true,
  bedCount: true,
  bathroomCount: true,
  area: true,
  amenities: true,

  imageUrl: true,
  imageUrls: true,

  isActive: true,
  featured: true,
  highlighted: true,
  featuredUntil: true,
  boostUntil: true,

  favoriteCount: true,
  viewCount: true,


  createdAt: true,
  updatedAt: true,

  blockedDates: {
    orderBy: {
      date: "asc",
    },
    select: {
      id: true,
      date: true,
    },
  },
} satisfies Prisma.ListingSelect;

export type ListingForEdit =
  Prisma.ListingGetPayload<{
    select: typeof listingForEditSelect;
  }>;

export default async function getListingForEdit(
  params: IParams
): Promise<ListingForEdit | null> {
  try {
    const currentUser =
      await getCurrentUser();

    if (
      !currentUser ||
      currentUser.isBanned
    ) {
      return null;
    }

    const listingId = params.listingId;

    if (
      !listingId ||
      typeof listingId !== "string" ||
      !isValidObjectId(listingId)
    ) {
      return null;
    }

    /*
     * Ownership يتم التحقق منه داخل الاستعلام.
     * هذا Action خاص بصاحب الإعلان فقط.
     */
    const listing =
      await prisma.listing.findFirst({
        where: {
          id: listingId,
          userId: currentUser.id,
        },
        select: listingForEditSelect,
      });

    return listing;
  } catch (error) {
    console.error(
      "GET_LISTING_FOR_EDIT_ERROR",
      error
    );

    return null;
  }
}