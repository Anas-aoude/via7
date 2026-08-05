import { NextResponse } from "next/server";

import getCurrentUser from "@/app/actions/users/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { CacheManager } from "@/app/services/cache/cache.manager";
import { RateLimitService } from "@/app/services/rate-limit";
import { verifyRequestOrigin } from "@/app/libs/security/verifyRequestOrigin";

interface IParams {
  listingId?: string;
}

interface ListingRouteProps {
  params: Promise<IParams>;
}

const MAX_IMAGES = 10;
const MAX_PRICE = 1_000_000_000;
const MAX_AREA = 10_000_000;
const MAX_COUNT = 1_000;
const MAX_AMENITIES = 50;
const MAX_AMENITY_LENGTH = 80;

const isValidObjectId = (value: string) => {
  return /^[a-f\d]{24}$/i.test(value);
};

const cleanText = (
  value: unknown,
  maxLength: number
) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
};

const parsePositiveNumber = (
  value: unknown,
  max: number
): number | null => {
  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number <= 0 ||
    number > max
  ) {
    return null;
  }

  return number;
};

const parseNullablePositiveNumber = (
  value: unknown,
  max: number
): number | null | undefined => {
  if (
    value === null ||
    value === "" ||
    typeof value === "undefined"
  ) {
    return null;
  }

  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number <= 0 ||
    number > max
  ) {
    return undefined;
  }

  return number;
};

const parseNullableNonNegativeInteger = (
  value: unknown,
  max: number
): number | null | undefined => {
  if (
    value === null ||
    value === "" ||
    typeof value === "undefined"
  ) {
    return null;
  }

  const number = Number(value);

  if (
    !Number.isInteger(number) ||
    number < 0 ||
    number > max
  ) {
    return undefined;
  }

  return number;
};

const isCloudinaryImage = (
  value: unknown
): value is string => {
  if (typeof value !== "string") {
    return false;
  }

  try {
    const url = new URL(value);

    if (
      url.protocol !== "https:" ||
      url.hostname !== "res.cloudinary.com"
    ) {
      return false;
    }

    return /\.(jpg|jpeg|png|webp|avif)$/i.test(
      url.pathname
    );
  } catch {
    return false;
  }
};

const invalidateListingCaches = async (
  listingId: string
) => {
  const results = await Promise.allSettled([
    CacheManager.invalidateHomepage(),
    CacheManager.invalidateListing(listingId),
    CacheManager.invalidateSearch(),
  ]);

  const failedResults = results.filter(
    (result) => result.status === "rejected"
  );

  if (failedResults.length > 0) {
    console.error(
      "OWNER_LISTING_CACHE_INVALIDATION_ERROR",
      failedResults
    );
  }
};

export async function PATCH(
  request: Request,
  { params }: ListingRouteProps
) {
  try {
    const originError = verifyRequestOrigin(request);

      if (originError) {
        return originError;
      }

    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (currentUser.isBanned) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const rateLimit =
      await RateLimitService.listings(
        currentUser.id
      );

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error:
            "Too many listing updates. Please try again later.",
          resetInSeconds:
            rateLimit.resetInSeconds,
        },
        { status: 429 }
      );
    }

    const { listingId } = await params;

    if (
      !listingId ||
      typeof listingId !== "string" ||
      !isValidObjectId(listingId)
    ) {
      return NextResponse.json(
        { error: "Invalid listing id" },
        { status: 400 }
      );
    }

    const existingListing =
      await prisma.listing.findUnique({
        where: {
          id: listingId,
        },
        select: {
          id: true,
          userId: true,
          isActive: true,
        },
      });

    if (!existingListing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    /*
     * هذا Route خاص بالمالك فقط.
     * Admin وManager يستخدمان Routes منفصلة.
     */
    if (
      existingListing.userId !==
      currentUser.id
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    let rawBody: unknown;

    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (
      !rawBody ||
      typeof rawBody !== "object" ||
      Array.isArray(rawBody)
    ) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const body = rawBody as Record<
      string,
      unknown
    >;

    const title = cleanText(
      body.title,
      120
    );

    const description = cleanText(
      body.description,
      5000
    );

    const governorate = cleanText(
      body.governorate,
      80
    );

    const city = cleanText(
      body.city,
      80
    );

    const district = cleanText(
      body.district,
      80
    );

    const street = cleanText(
      body.street,
      120
    );

    const address = cleanText(
      body.address,
      200
    );

    const category = cleanText(
      body.category,
      80
    );

    const type = cleanText(
      body.type,
      80
    );

    const purpose = cleanText(
      body.purpose,
      20
    ).toLowerCase();

    const price = parsePositiveNumber(
      body.price,
      MAX_PRICE
    );

    if (
      !title ||
      !description ||
      !governorate ||
      !category ||
      !type ||
      !price
    ) {
      return NextResponse.json(
        { error: "Invalid fields" },
        { status: 400 }
      );
    }

    if (
      purpose !== "rent" &&
      purpose !== "sale"
    ) {
      return NextResponse.json(
        { error: "Invalid purpose" },
        { status: 400 }
      );
    }

    let latitude: number | null = null;

    if (
      body.latitude !== null &&
      body.latitude !== "" &&
      typeof body.latitude !== "undefined"
    ) {
      latitude = Number(body.latitude);

      if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90
      ) {
        return NextResponse.json(
          { error: "Invalid latitude" },
          { status: 400 }
        );
      }
    }

    let longitude: number | null = null;

    if (
      body.longitude !== null &&
      body.longitude !== "" &&
      typeof body.longitude !== "undefined"
    ) {
      longitude = Number(body.longitude);

      if (
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
      ) {
        return NextResponse.json(
          { error: "Invalid longitude" },
          { status: 400 }
        );
      }
    }

    if (!Array.isArray(body.imageUrls)) {
      return NextResponse.json(
        { error: "Invalid images" },
        { status: 400 }
      );
    }

    if (
      body.imageUrls.length === 0 ||
      body.imageUrls.length > MAX_IMAGES ||
      !body.imageUrls.every(
        isCloudinaryImage
      )
    ) {
      return NextResponse.json(
        { error: "Invalid images" },
        { status: 400 }
      );
    }

    const imageUrls = [
      ...new Set(body.imageUrls),
    ];

    if (
      typeof body.amenities !==
      "undefined" &&
      !Array.isArray(body.amenities)
    ) {
      return NextResponse.json(
        { error: "Invalid amenities" },
        { status: 400 }
      );
    }

    const amenities = Array.isArray(
      body.amenities
    )
      ? [
        ...new Set(
          body.amenities
            .filter(
              (
                item
              ): item is string =>
                typeof item === "string"
            )
            .map((item) =>
              cleanText(
                item,
                MAX_AMENITY_LENGTH
              )
            )
            .filter(Boolean)
        ),
      ].slice(0, MAX_AMENITIES)
      : [];

    const guestCount =
      parseNullableNonNegativeInteger(
        body.guestCount,
        MAX_COUNT
      );

    if (guestCount === undefined) {
      return NextResponse.json(
        { error: "Invalid guest count" },
        { status: 400 }
      );
    }

    const bedroomCount =
      parseNullableNonNegativeInteger(
        body.bedroomCount,
        MAX_COUNT
      );

    if (bedroomCount === undefined) {
      return NextResponse.json(
        { error: "Invalid bedroom count" },
        { status: 400 }
      );
    }

    const bedCount =
      parseNullableNonNegativeInteger(
        body.bedCount,
        MAX_COUNT
      );

    if (bedCount === undefined) {
      return NextResponse.json(
        { error: "Invalid bed count" },
        { status: 400 }
      );
    }

    const bathroomCount =
      parseNullableNonNegativeInteger(
        body.bathroomCount,
        MAX_COUNT
      );

    if (bathroomCount === undefined) {
      return NextResponse.json(
        { error: "Invalid bathroom count" },
        { status: 400 }
      );
    }

    const area =
      parseNullablePositiveNumber(
        body.area,
        MAX_AREA
      );

    if (area === undefined) {
      return NextResponse.json(
        { error: "Invalid area" },
        { status: 400 }
      );
    }

    let isActive =
      existingListing.isActive;

    if (
      typeof body.isActive !== "undefined"
    ) {
      if (
        typeof body.isActive !== "boolean"
      ) {
        return NextResponse.json(
          { error: "Invalid active status" },
          { status: 400 }
        );
      }

      isActive = body.isActive;
    }

    const updatedListing =
      await prisma.listing.update({
        where: {
          id: listingId,
        },
        data: {
          title,
          description,
          price,
          governorate,
          city: city || null,
          district: district || null,
          street: street || null,
          address: address || null,
          latitude,
          longitude,
          category,
          type,
          purpose,
          amenities,
          guestCount,
          bedroomCount,
          bedCount,
          bathroomCount,
          area,
          imageUrl: imageUrls[0],
          imageUrls,
          isActive,
        },
        select: {
          id: true,
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
          amenities: true,
          guestCount: true,
          bedroomCount: true,
          bedCount: true,
          bathroomCount: true,
          area: true,
          imageUrl: true,
          imageUrls: true,
          isActive: true,
          featured: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    await invalidateListingCaches(
      listingId
    );

    return NextResponse.json(
      updatedListing
    );
  } catch (error) {
    console.error(
      "OWNER_LISTING_PATCH_ERROR",
      error
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}