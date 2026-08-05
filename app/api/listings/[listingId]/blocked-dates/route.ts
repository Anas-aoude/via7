import { NextResponse } from "next/server";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/users/getCurrentUser";
import { verifyRequestOrigin } from "@/app/libs/security/verifyRequestOrigin";
import { CacheManager } from "@/app/services/cache/cache.manager";
import { RateLimitService } from "@/app/services/rate-limit";

interface IParams {
  listingId?: string;
}

interface BlockedDatesBody {
  date?: unknown;
  dates?: unknown;
}

const MAX_DATES_PER_REQUEST = 366;

const isValidObjectId = (value: string) => {
  return /^[a-f\d]{24}$/i.test(value);
};

/**
 * يقبل:
 * YYYY-MM-DD
 * أو تاريخًا يمكن لـ JavaScript تحليله بشكل صحيح.
 *
 * ويتم تخزين اليوم عند منتصف الليل UTC لتجنب
 * اختلاف التاريخ بين السيرفر والمتصفح.
 */
const normalizeDate = (value: unknown): Date | null => {
  if (
    typeof value !== "string" &&
    !(value instanceof Date)
  ) {
    return null;
  }

  const rawValue =
    value instanceof Date
      ? value.toISOString()
      : value.trim();

  if (!rawValue) {
    return null;
  }

  const dateOnlyMatch = rawValue.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);

    const date = new Date(
      Date.UTC(year, month - 1, day)
    );

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }

    return date;
  }

  const parsedDate = new Date(rawValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return new Date(
    Date.UTC(
      parsedDate.getUTCFullYear(),
      parsedDate.getUTCMonth(),
      parsedDate.getUTCDate()
    )
  );
};

const parseDates = (
  body: BlockedDatesBody
):
  | {
    dates: Date[];
    error: null;
  }
  | {
    dates: [];
    error: string;
  } => {
  let rawDates: unknown[];

  if (typeof body.dates !== "undefined") {
    if (!Array.isArray(body.dates)) {
      return {
        dates: [],
        error: "Invalid dates",
      };
    }

    rawDates = body.dates;
  } else if (typeof body.date !== "undefined") {
    rawDates = [body.date];
  } else {
    return {
      dates: [],
      error: "Date is required",
    };
  }

  if (
    rawDates.length === 0 ||
    rawDates.length > MAX_DATES_PER_REQUEST
  ) {
    return {
      dates: [],
      error: "Invalid number of dates",
    };
  }

  const normalizedDates =
    rawDates.map(normalizeDate);

  if (
    normalizedDates.some(
      (date) => date === null
    )
  ) {
    return {
      dates: [],
      error: "Invalid date",
    };
  }

  const uniqueDates = [
    ...new Map(
      (
        normalizedDates as Date[]
      ).map((date) => [
        date.toISOString(),
        date,
      ])
    ).values(),
  ];

  return {
    dates: uniqueDates,
    error: null,
  };
};

const readJsonBody = async (
  request: Request
): Promise<
  | {
    body: BlockedDatesBody;
    response: null;
  }
  | {
    body: null;
    response: NextResponse;
  }
> => {
  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return {
      body: null,
      response: NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      ),
    };
  }

  if (
    !rawBody ||
    typeof rawBody !== "object" ||
    Array.isArray(rawBody)
  ) {
    return {
      body: null,
      response: NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      ),
    };
  }

  return {
    body: rawBody as BlockedDatesBody,
    response: null,
  };
};

const invalidateAvailabilityCaches = async (
  listingId: string
) => {
  const results = await Promise.allSettled([
    CacheManager.invalidateListing(listingId),
    CacheManager.invalidateSearch(),
    CacheManager.invalidateHomepage(),
  ]);

  const failedResults = results.filter(
    (result) => result.status === "rejected"
  );

  if (failedResults.length > 0) {
    console.error(
      "AVAILABILITY_CACHE_INVALIDATION_ERROR",
      failedResults
    );
  }
};

const getAuthorizedListing = async (
  listingId: string,
  currentUser: Awaited<
    ReturnType<typeof getCurrentUser>
  >
) => {
  const listing =
    await prisma.listing.findUnique({
      where: {
        id: listingId,
      },
      select: {
        id: true,
        userId: true,
      },
    });

  if (!listing) {
    return {
      listing: null,
      response: NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      ),
    };
  }

  if (!currentUser) {
    return {
      listing: null,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const canManageAvailability =
    listing.userId === currentUser.id ||
    currentUser.role === "ADMIN" ||
    currentUser.role === "MANAGER";

  if (!canManageAvailability) {
    return {
      listing: null,
      response: NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return {
    listing,
    response: null,
  };
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<IParams> }
) {
  try {
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

    const listingExists =
      await prisma.listing.findUnique({
        where: {
          id: listingId,
        },
        select: {
          id: true,
        },
      });

    if (!listingExists) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    const blockedDates =
      await prisma.listingBlockedDate.findMany({
        where: {
          listingId,
        },
        orderBy: {
          date: "asc",
        },
        select: {
          id: true,
          date: true,
        },
      });

    return NextResponse.json(blockedDates);
  } catch (error) {
    console.error(
      "BLOCKED_DATES_GET_ERROR",
      error
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<IParams> }
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
      await RateLimitService.check({
        key: `listing-block-dates:${currentUser.id}`,
        limit: 120,
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

    const authorization =
      await getAuthorizedListing(
        listingId,
        currentUser
      );

    if (
      authorization.response ||
      !authorization.listing
    ) {
      return authorization.response;
    }

    const jsonResult =
      await readJsonBody(request);

    if (
      jsonResult.response ||
      !jsonResult.body
    ) {
      return jsonResult.response;
    }

    const parsedDates = parseDates(
      jsonResult.body
    );

    if (parsedDates.error) {
      return NextResponse.json(
        { error: parsedDates.error },
        { status: 400 }
      );
    }

    await Promise.all(
      parsedDates.dates.map((date) =>
        prisma.listingBlockedDate.upsert({
          where: {
            listingId_date: {
              listingId,
              date,
            },
          },
          update: {},
          create: {
            listingId,
            date,
          },
        })
      )
    );

    await invalidateAvailabilityCaches(
      listingId
    );

    return NextResponse.json({
      success: true,
      affectedCount:
        parsedDates.dates.length,
    });
  } catch (error) {
    console.error(
      "BLOCK_DATES_ERROR",
      error
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<IParams> }
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
      await RateLimitService.check({
        key: `listing-unblock-dates:${currentUser.id}`,
        limit: 120,
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

    const authorization =
      await getAuthorizedListing(
        listingId,
        currentUser
      );

    if (
      authorization.response ||
      !authorization.listing
    ) {
      return authorization.response;
    }

    const jsonResult =
      await readJsonBody(request);

    if (
      jsonResult.response ||
      !jsonResult.body
    ) {
      return jsonResult.response;
    }

    const parsedDates = parseDates(
      jsonResult.body
    );

    if (parsedDates.error) {
      return NextResponse.json(
        { error: parsedDates.error },
        { status: 400 }
      );
    }

    const deleteResult =
      await prisma.listingBlockedDate.deleteMany({
        where: {
          listingId,
          date: {
            in: parsedDates.dates,
          },
        },
      });

    await invalidateAvailabilityCaches(
      listingId
    );

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
    });
  } catch (error) {
    console.error(
      "UNBLOCK_DATES_ERROR",
      error
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}