import { NextResponse } from "next/server";
import {
  RentPeriod,
  UserRole,
  AuditAction,
  AuditTargetType,
} from "@prisma/client";


import { createAuditLog } from "@/app/libs/auditLog";
import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/users/getCurrentUser";
import { CacheManager } from "@/app/services/cache/cache.manager";
import { hasReachedListingLimit } from "@/app/libs/listingLimits";
import { RateLimitService } from "@/app/services/rate-limit";
import { verifyRequestOrigin } from "@/app/libs/security/verifyRequestOrigin";

const allowedRentPeriods: RentPeriod[] = [
  RentPeriod.DAILY,
  RentPeriod.WEEKLY,
  RentPeriod.MONTHLY,
  RentPeriod.YEARLY,
];

const MAX_IMAGES = 10;
const MAX_PRICE = 1_000_000_000;
const MAX_AREA = 10_000_000;
const MAX_COUNT = 1_000;
const MAX_AMENITIES = 30;
const MAX_AMENITY_LENGTH = 80;

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

const parseOptionalFutureDate = (
  value: unknown
):
  | {
    value: Date | null;
    valid: true;
  }
  | {
    value: null;
    valid: false;
  } => {
  if (
    value === null ||
    value === "" ||
    typeof value === "undefined"
  ) {
    return {
      value: null,
      valid: true,
    };
  }

  if (typeof value !== "string") {
    return {
      value: null,
      valid: false,
    };
  }

  const match = value
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return {
      value: null,
      valid: false,
    };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return {
      value: null,
      valid: false,
    };
  }

  const now = new Date();

  const today = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
  );

  if (date < today) {
    return {
      value: null,
      valid: false,
    };
  }

  return {
    value: date,
    valid: true,
  };
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
      "CREATE_LISTING_CACHE_INVALIDATION_ERROR",
      failedResults
    );
  }
};

export async function POST(request: Request) {
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
            "Too many listing attempts. Please try again later.",
          resetInSeconds:
            rateLimit.resetInSeconds,
        },
        { status: 429 }
      );
    }

    const currentListingsCount =
      await prisma.listing.count({
        where: {
          userId: currentUser.id,
        },
      });

    if (
      hasReachedListingLimit(
        currentUser.role,
        currentListingsCount
      )
    ) {
      let error = "LISTING_LIMIT";

      switch (currentUser.role) {
        case UserRole.USER:
          error = "LISTING_LIMIT_USER";
          break;

        case UserRole.HOST:
          error = "LISTING_LIMIT_HOST";
          break;

        case UserRole.VIP_HOST:
          error = "LISTING_LIMIT_VIP";
          break;

        case UserRole.AGENCY:
          error = "LISTING_LIMIT_AGENCY";
          break;
      }

      return NextResponse.json(
        { error },
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

    let rentPeriod: RentPeriod | null =
      null;

    if (purpose === "rent") {
      if (
        typeof body.rentPeriod !==
        "string" ||
        !allowedRentPeriods.includes(
          body.rentPeriod as RentPeriod
        )
      ) {
        return NextResponse.json(
          { error: "Invalid rent period" },
          { status: 400 }
        );
      }

      rentPeriod =
        body.rentPeriod as RentPeriod;
    }

    const availableFromResult =
      parseOptionalFutureDate(
        body.availableFrom
      );

    if (!availableFromResult.valid) {
      return NextResponse.json(
        { error: "Invalid available date" },
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

    const listing =
      await prisma.listing.create({
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
          rentPeriod,
          availableFrom:
            availableFromResult.value,

          amenities,

          guestCount,
          bedroomCount,
          bedCount,
          bathroomCount,
          area,

          imageUrl: imageUrls[0],
          imageUrls,

          userId: currentUser.id,
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
          rentPeriod: true,
          availableFrom: true,
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

    await createAuditLog({
      userId: currentUser.id,
      action: AuditAction.CREATE_LISTING,
      targetType: AuditTargetType.LISTING,
      targetId: listing.id,
      metadata: {
        title: listing.title,
        price: listing.price,
        governorate: listing.governorate,
        city: listing.city,
        category: listing.category,
        type: listing.type,
        purpose: listing.purpose,
        rentPeriod: listing.rentPeriod,
      },
    });

    await invalidateListingCaches(listing.id);
    return NextResponse.json(
      listing,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE_LISTING_ERROR",
      error
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}