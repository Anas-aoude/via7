import crypto from "crypto";
import { NextResponse } from "next/server";

import prisma from "@/app/libs/prismadb";
import { sendPasswordResetEmail } from "@/app/libs/mail";
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
      key: `forgot-password:${normalizedEmail}`,
      limit: 3,
      windowSeconds: 60 * 60,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: "TOO_MANY_PASSWORD_RESET_REQUESTS",
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
        hashedPassword: true,
      },
    });

    if (!user || !user.hashedPassword) {
      return NextResponse.json({
        success: true,
        message: "PASSWORD_RESET_EMAIL_SENT",
      });
    }

    await prisma.passwordResetToken.deleteMany({
      where: {
        email: normalizedEmail,
      },
    });

    const token = crypto.randomBytes(32).toString("hex");

    await prisma.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        token,
        expires: new Date(Date.now() + 1000 * 60 * 60),
      },
    });

    await sendPasswordResetEmail(normalizedEmail, token);

    return NextResponse.json({
      success: true,
      message: "PASSWORD_RESET_EMAIL_SENT",
    });
  } catch (error) {
    console.log("FORGOT_PASSWORD_ERROR", error);

    return NextResponse.json(
      { success: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}