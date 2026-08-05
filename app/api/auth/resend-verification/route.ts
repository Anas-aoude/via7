import crypto from "crypto";
import { NextResponse } from "next/server";

import prisma from "@/app/libs/prismadb";
import { sendVerificationEmail } from "@/app/libs/mail";
import { RateLimitService } from "@/app/services/rate-limit";
import { verifyRequestOrigin } from "@/app/libs/security/verifyRequestOrigin";

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export async function POST(request: Request) {
  try {
    const originError = verifyRequestOrigin(request);

      if (originError) {
        return originError;
      }

    const body = await request.json();

    const normalizedEmail =
      typeof body.email === "string" ? body.email.toLowerCase().trim() : "";

    if (
      !normalizedEmail ||
      normalizedEmail.length > 254 ||
      !isValidEmail(normalizedEmail)
    ) {
      return NextResponse.json(
        { success: false, error: "INVALID_EMAIL" },
        { status: 400 }
      );
    }

    const rateLimit = await RateLimitService.check({
      key: `resend-verification:${normalizedEmail}`,
      limit: 3,
      windowSeconds: 60 * 60,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: "TOO_MANY_VERIFICATION_REQUESTS",
        },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        id: true,
        emailVerified: true,
      },
    });

    if (!user || user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: "VERIFICATION_EMAIL_SENT",
      });
    }

    await prisma.emailVerificationToken.deleteMany({
      where: {
        email: normalizedEmail,
      },
    });

    const token = crypto.randomBytes(32).toString("hex");

    await prisma.emailVerificationToken.create({
      data: {
        email: normalizedEmail,
        token,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    await sendVerificationEmail(normalizedEmail, token);

    return NextResponse.json({
      success: true,
      message: "VERIFICATION_EMAIL_SENT",
    });
  } catch (error) {
    console.log("RESEND_VERIFICATION_ERROR", error);

    return NextResponse.json(
      { success: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}