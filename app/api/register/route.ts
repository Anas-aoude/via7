import bcrypt from "bcrypt";
import crypto from "crypto";
import prisma from "@/app/libs/prismadb";
import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/app/libs/mail";
import { RateLimitService } from "@/app/services/rate-limit";
import { verifyRequestOrigin } from "@/app/libs/security/verifyRequestOrigin";

export async function POST(request: Request) {
  try {
    const originError = verifyRequestOrigin(request);

      if (originError) {
        return originError;
      }

    const body = await request.json();

    const normalizedEmail =
      typeof body.email === "string" ? body.email.toLowerCase().trim() : "";

    const normalizedName =
      typeof body.name === "string" ? body.name.trim() : "";

    const password =
      typeof body.password === "string" ? body.password : "";

    if (!normalizedEmail || !normalizedName || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const rateLimit = await RateLimitService.register(normalizedEmail);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "TOO_MANY_REGISTER_ATTEMPTS",
          resetInSeconds: rateLimit.resetInSeconds,
        },
        { status: 429 }
      );
    }

    if (
      normalizedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    }

    if (normalizedName.length < 2 || normalizedName.length > 50) {
      return NextResponse.json({ error: "INVALID_NAME" }, { status: 400 });
    }

    if (password.length < 8 || password.length > 100) {
      return NextResponse.json({ error: "INVALID_PASSWORD" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "EMAIL_ALREADY_EXISTS" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: normalizedName,
        hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

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
      message: "Verification email sent",
      user,
    });
  } catch (error) {
    console.log("REGISTER_ERROR", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}