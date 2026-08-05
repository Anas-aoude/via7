import bcrypt from "bcrypt";
import crypto from "crypto";
import { NextResponse } from "next/server";

import prisma from "@/app/libs/prismadb";
import { RateLimitService } from "@/app/services/rate-limit";
import { verifyRequestOrigin } from "@/app/libs/security/verifyRequestOrigin";

export async function POST(request: Request) {
  try {
    const originError = verifyRequestOrigin(request);

      if (originError) {
        return originError;
      }

    const body = await request.json();

    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password =
      typeof body.password === "string" ? body.password : "";

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "MISSING_FIELDS" },
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
      key: `reset-password:${tokenHash}`,
      limit: 5,
      windowSeconds: 60 * 60,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: "TOO_MANY_RESET_ATTEMPTS",
        },
        { status: 429 }
      );
    }

    if (password.length < 8 || password.length > 100) {
      return NextResponse.json(
        { success: false, error: "INVALID_PASSWORD" },
        { status: 400 }
      );
    }

    const existingToken = await prisma.passwordResetToken.findUnique({
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
      await prisma.passwordResetToken.delete({
        where: {
          id: existingToken.id,
        },
      });

      return NextResponse.json(
        { success: false, error: "TOKEN_EXPIRED" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: {
          email: existingToken.email,
        },
        data: {
          hashedPassword,
        },
      }),

      prisma.passwordResetToken.delete({
        where: {
          id: existingToken.id,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "PASSWORD_RESET_SUCCESS",
    });
  } catch (error) {
    console.log("RESET_PASSWORD_ERROR", error);

    return NextResponse.json(
      { success: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}