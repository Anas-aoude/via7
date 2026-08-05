import { NextResponse } from "next/server";

import getCurrentUser from "@/app/actions/users/getCurrentUser";
import { verifyRequestOrigin } from "@/app/libs/security/verifyRequestOrigin";
import { RateLimitService } from "@/app/services/rate-limit";

const MAX_QUERY_LENGTH = 300;

export async function POST(request: Request) {
  try {
    const originError = verifyRequestOrigin(request);

      if (originError) {
        return originError;
      }

    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.isBanned) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await RateLimitService.check({
      key: `geocode:${currentUser.id}`,
      limit: 30,
      windowSeconds: 60 * 60,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many geocode requests" },
        { status: 429 }
      );
    }

    const body = await request.json();

    const governorate =
      typeof body.governorate === "string" ? body.governorate.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const district =
      typeof body.district === "string" ? body.district.trim() : "";
    const address =
      typeof body.address === "string" ? body.address.trim() : "";

    if (
      governorate.length > 100 ||
      city.length > 100 ||
      district.length > 100 ||
      address.length > 200
    ) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }

    const query = [address, district, city, governorate, "Syria"]
      .filter(Boolean)
      .join(", ")
      .slice(0, MAX_QUERY_LENGTH);

    if (!query.trim()) {
      return NextResponse.json({ error: "Missing address" }, { status: 400 });
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");

    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "VIA7/1.0",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Geocoding service unavailable" },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    const latitude = Number(data[0]?.lat);
    const longitude = Number(data[0]?.lon);
    const displayName =
      typeof data[0]?.display_name === "string" ? data[0].display_name : "";

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json(
        { error: "Invalid geocoding response" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      latitude,
      longitude,
      displayName,
    });
  } catch (error) {
    console.log("GEOCODE_ERROR", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}