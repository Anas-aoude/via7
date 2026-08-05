import { NextResponse } from "next/server";
import {
  AuditAction,
  AuditTargetType,
} from "@prisma/client";

import prisma from "@/app/libs/prismadb";
import { createAuditLog } from "@/app/libs/auditLog";
import getCurrentUser from "@/app/actions/users/getCurrentUser";
import { CacheManager } from "@/app/services/cache/cache.manager";
import { verifyRequestOrigin } from "@/app/libs/security/verifyRequestOrigin";
import { RateLimitService } from "@/app/services/rate-limit";

interface IParams {
  listingId?: string;
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

async function requireManager() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      currentUser: null,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  if (
    currentUser.role !== "MANAGER" ||
    currentUser.isBanned
  ) {
    return {
      currentUser: null,
      response: NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return {
    currentUser,
    response: null,
  };
}

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

const parseBoolean = (
  value: unknown
): boolean | null => {
  if (value === true) {
    return true;
  }

  if (value === false) {
    return false;
  }

  return null;
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
      "MANAGER_LISTING_CACHE_INVALIDATION_ERROR",
      failedResults
    );
  }
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<IParams> }
) {
  try {
    const originError = verifyRequestOrigin(request);

      if (originError) {
        return originError;
      }

    const auth = await requireManager();

    if (
      auth.response ||
      !auth.currentUser
    ) {
      return auth.response;
    }

    const currentUser = auth.currentUser;

    const rateLimit =
      await RateLimitService.check({
        key: `manager-update-listing:${currentUser.id}`,
        limit: 60,
        windowSeconds: 60 * 60,
      });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many requests",
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
          title: true,
          featured: true,
          isActive: true,
          user: {
            select: {
              id: true,
              role: true,
            },
          },
        },
      });

    if (!existingListing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    /*
     * Manager يتعامل فقط مع إعلانات:
     * USER / HOST / VIP_HOST / AGENCY
     *
     * ولا يستطيع تعديل إعلانات Manager أو Admin.
     */
    if (
      existingListing.user.role === "ADMIN" ||
      existingListing.user.role === "MANAGER"
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

    const updateData: {
      title?: string;
      description?: string;
      price?: number;
      governorate?: string;
      city?: string | null;
      district?: string | null;
      street?: string | null;
      address?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      category?: string;
      type?: string;
      purpose?: string;
      amenities?: string[];
      guestCount?: number | null;
      bedroomCount?: number | null;
      bedCount?: number | null;
      bathroomCount?: number | null;
      area?: number | null;
      imageUrl?: string | null;
      imageUrls?: string[];
      isActive?: boolean;
      featured?: boolean;
    } = {};

    if (typeof body.title !== "undefined") {
      const title = cleanText(body.title, 120);

      if (!title) {
        return NextResponse.json(
          { error: "Invalid title" },
          { status: 400 }
        );
      }

      updateData.title = title;
    }

    if (
      typeof body.description !== "undefined"
    ) {
      const description = cleanText(
        body.description,
        5000
      );

      if (!description) {
        return NextResponse.json(
          { error: "Invalid description" },
          { status: 400 }
        );
      }

      updateData.description = description;
    }

    if (typeof body.price !== "undefined") {
      const price = parsePositiveNumber(
        body.price,
        MAX_PRICE
      );

      if (price === null) {
        return NextResponse.json(
          { error: "Invalid price" },
          { status: 400 }
        );
      }

      updateData.price = price;
    }

    if (
      typeof body.governorate !== "undefined"
    ) {
      const governorate = cleanText(
        body.governorate,
        80
      );

      if (!governorate) {
        return NextResponse.json(
          { error: "Invalid governorate" },
          { status: 400 }
        );
      }

      updateData.governorate = governorate;
    }

    if (typeof body.city !== "undefined") {
      updateData.city =
        cleanText(body.city, 80) || null;
    }

    if (
      typeof body.district !== "undefined"
    ) {
      updateData.district =
        cleanText(body.district, 80) || null;
    }

    if (typeof body.street !== "undefined") {
      updateData.street =
        cleanText(body.street, 120) || null;
    }

    if (
      typeof body.address !== "undefined"
    ) {
      updateData.address =
        cleanText(body.address, 200) || null;
    }

    if (
      typeof body.latitude !== "undefined"
    ) {
      if (
        body.latitude === null ||
        body.latitude === ""
      ) {
        updateData.latitude = null;
      } else {
        const latitude = Number(body.latitude);

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

        updateData.latitude = latitude;
      }
    }

    if (
      typeof body.longitude !== "undefined"
    ) {
      if (
        body.longitude === null ||
        body.longitude === ""
      ) {
        updateData.longitude = null;
      } else {
        const longitude = Number(
          body.longitude
        );

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

        updateData.longitude = longitude;
      }
    }

    if (
      typeof body.category !== "undefined"
    ) {
      const category = cleanText(
        body.category,
        80
      );

      if (!category) {
        return NextResponse.json(
          { error: "Invalid category" },
          { status: 400 }
        );
      }

      updateData.category = category;
    }

    if (typeof body.type !== "undefined") {
      const type = cleanText(body.type, 80);

      if (!type) {
        return NextResponse.json(
          { error: "Invalid type" },
          { status: 400 }
        );
      }

      updateData.type = type;
    }

    if (
      typeof body.purpose !== "undefined"
    ) {
      const purpose = cleanText(
        body.purpose,
        20
      ).toLowerCase();

      if (
        purpose !== "rent" &&
        purpose !== "sale"
      ) {
        return NextResponse.json(
          { error: "Invalid purpose" },
          { status: 400 }
        );
      }

      updateData.purpose = purpose;
    }

    if (
      typeof body.amenities !== "undefined"
    ) {
      if (!Array.isArray(body.amenities)) {
        return NextResponse.json(
          { error: "Invalid amenities" },
          { status: 400 }
        );
      }

      if (
        body.amenities.some(
          (item) => typeof item !== "string"
        )
      ) {
        return NextResponse.json(
          { error: "Invalid amenities" },
          { status: 400 }
        );
      }

      updateData.amenities = [
        ...new Set(
          body.amenities
            .map((item) =>
              cleanText(
                item,
                MAX_AMENITY_LENGTH
              )
            )
            .filter(Boolean)
        ),
      ].slice(0, MAX_AMENITIES);
    }

    if (
      typeof body.guestCount !== "undefined"
    ) {
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

      updateData.guestCount = guestCount;
    }

    if (
      typeof body.bedroomCount !==
      "undefined"
    ) {
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

      updateData.bedroomCount =
        bedroomCount;
    }

    if (
      typeof body.bedCount !== "undefined"
    ) {
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

      updateData.bedCount = bedCount;
    }

    if (
      typeof body.bathroomCount !==
      "undefined"
    ) {
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

      updateData.bathroomCount =
        bathroomCount;
    }

    if (typeof body.area !== "undefined") {
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

      updateData.area = area;
    }

    if (
      typeof body.imageUrls !== "undefined"
    ) {
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

      updateData.imageUrls = imageUrls;
      updateData.imageUrl = imageUrls[0];
    }

    if (
      typeof body.imageUrl !== "undefined" &&
      typeof body.imageUrls === "undefined"
    ) {
      if (
        body.imageUrl === null ||
        body.imageUrl === ""
      ) {
        updateData.imageUrl = null;
      } else {
        if (
          !isCloudinaryImage(body.imageUrl)
        ) {
          return NextResponse.json(
            { error: "Invalid image" },
            { status: 400 }
          );
        }

        updateData.imageUrl = body.imageUrl;
      }
    }

    if (
      typeof body.isActive !== "undefined"
    ) {
      const isActive = parseBoolean(
        body.isActive
      );

      if (isActive === null) {
        return NextResponse.json(
          { error: "Invalid active status" },
          { status: 400 }
        );
      }

      updateData.isActive = isActive;
    }

    if (
      typeof body.featured !== "undefined"
    ) {
      const featured = parseBoolean(
        body.featured
      );

      if (featured === null) {
        return NextResponse.json(
          { error: "Invalid featured status" },
          { status: 400 }
        );
      }

      updateData.featured = featured;
    }

    if (
      Object.keys(updateData).length === 0
    ) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const listing =
      await prisma.listing.update({
        where: {
          id: listingId,
        },
        data: updateData,
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

    const updatedFields =
      Object.keys(updateData);

    if (
      typeof updateData.isActive !==
      "undefined" &&
      listing.isActive !==
      existingListing.isActive
    ) {
      await createAuditLog({
        userId: currentUser.id,
        action:
          AuditAction.MANAGER_SET_ACTIVE,
        targetType: AuditTargetType.LISTING,
        targetId: listing.id,
        metadata: {
          title: listing.title,
          previousIsActive:
            existingListing.isActive,
          newIsActive: listing.isActive,
        },
      });
    }

    if (
      typeof updateData.featured !==
      "undefined" &&
      listing.featured !==
      existingListing.featured
    ) {
      await createAuditLog({
        userId: currentUser.id,
        action:
          AuditAction.MANAGER_SET_FEATURED,
        targetType: AuditTargetType.LISTING,
        targetId: listing.id,
        metadata: {
          title: listing.title,
          previousFeatured:
            existingListing.featured,
          newFeatured: listing.featured,
        },
      });
    }

    const normalUpdateFields =
      updatedFields.filter(
        (field) =>
          field !== "isActive" &&
          field !== "featured"
      );

    if (normalUpdateFields.length > 0) {
      await createAuditLog({
        userId: currentUser.id,
        action:
          AuditAction.MANAGER_UPDATE_LISTING,
        targetType: AuditTargetType.LISTING,
        targetId: listing.id,
        metadata: {
          title: listing.title,
          updatedFields:
            normalUpdateFields,
        },
      });
    }

    await invalidateListingCaches(
      listingId
    );

    return NextResponse.json(listing);
  } catch (error) {
    console.error(
      "MANAGER_LISTING_PATCH_ERROR",
      error
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}