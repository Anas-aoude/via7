import crypto from "crypto";
import { NextResponse } from "next/server";

import prisma from "@/app/libs/prismadb";
import { RateLimitService } from "@/app/services/rate-limit";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const token = searchParams.get("token")?.trim() || "";

    if (!token) {
      return NextResponse.json(
        { success: false, error: "TOKEN_MISSING" },
        { status: 400 }
      );
    }

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json(
        { success: false, error: "INVALID_TOKEN" },
        { status: 400 }
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const rateLimit = await RateLimitService.check({
      key: `verify-email:${tokenHash}`,
      limit: 10,
      windowSeconds: 60 * 60,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: "TOO_MANY_REQUESTS",
        },
        { status: 429 }
      );
    }

    const existingToken = await prisma.emailVerificationToken.findUnique({
      where: {
        token,
      },
    });

    if (!existingToken) {
      return NextResponse.json(
        { success: false, error: "INVALID_TOKEN" },
        { status: 400 }
      );
    }

    if (existingToken.expires < new Date()) {
      await prisma.emailVerificationToken.delete({
        where: {
          id: existingToken.id,
        },
      });

      return NextResponse.json(
        { success: false, error: "TOKEN_EXPIRED" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: existingToken.email,
      },
      select: {
        id: true,
        emailVerified: true,
      },
    });

    if (!existingUser) {
      await prisma.emailVerificationToken.delete({
        where: {
          id: existingToken.id,
        },
      });

      return NextResponse.json(
        { success: false, error: "INVALID_TOKEN" },
        { status: 400 }
      );
    }

    if (!existingUser.emailVerified) {
      await prisma.$transaction([
        prisma.user.update({
          where: {
            email: existingToken.email,
          },
          data: {
            emailVerified: new Date(),
          },
        }),

        prisma.emailVerificationToken.delete({
          where: {
            id: existingToken.id,
          },
        }),
      ]);
    } else {
      await prisma.emailVerificationToken.delete({
        where: {
          id: existingToken.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "EMAIL_VERIFIED",
    });
  } catch (error) {
    console.log("VERIFY_EMAIL_ERROR", error);

    return NextResponse.json(
      { success: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}