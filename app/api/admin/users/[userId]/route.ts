import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import {
  Prisma,
  UserRole,
} from "@prisma/client";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/users/getCurrentUser";
import { RateLimitService } from "@/app/services/rate-limit";
import { verifyRequestOrigin } from "@/app/libs/security/verifyRequestOrigin";

interface IParams {
  userId?: string;
}

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 100;

const allowedRoles: UserRole[] = [
  "USER",
  "HOST",
  "VIP_HOST",
  "AGENCY",
  "MANAGER",
  "ADMIN",
];

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

const isValidEmail = (email: string) => {
  if (
    !email ||
    email.length > MAX_EMAIL_LENGTH
  ) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
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

async function requireAdmin() {
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
    currentUser.role !== "ADMIN" ||
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

const isLastAdmin = async (
  targetRole: UserRole
) => {
  if (targetRole !== "ADMIN") {
    return false;
  }

  const adminCount = await prisma.user.count({
    where: {
      role: "ADMIN",
      isBanned: false,
    },
  });

  return adminCount <= 1;
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

    const auth = await requireAdmin();

    if (
      auth.response ||
      !auth.currentUser
    ) {
      return auth.response;
    }

    const currentUser = auth.currentUser;

    const rateLimit =
      await RateLimitService.check({
        key: `admin-update-user:${currentUser.id}`,
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

    const { userId } = await params;

    if (
      !userId ||
      typeof userId !== "string" ||
      !isValidObjectId(userId)
    ) {
      return NextResponse.json(
        { error: "Invalid user id" },
        { status: 400 }
      );
    }

    const targetUser =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isBanned: true,
        },
      });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
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

    const updateData: Prisma.UserUpdateInput =
      {};

    if (typeof body.name !== "undefined") {
      if (
        body.name !== null &&
        typeof body.name !== "string"
      ) {
        return NextResponse.json(
          { error: "Invalid name" },
          { status: 400 }
        );
      }

      if (body.name === null) {
        updateData.name = null;
      } else {
        const name = cleanText(
          body.name,
          MAX_NAME_LENGTH
        );

        updateData.name = name || null;
      }
    }

    if (typeof body.email !== "undefined") {
      if (typeof body.email !== "string") {
        return NextResponse.json(
          { error: "Invalid email" },
          { status: 400 }
        );
      }

      const email = cleanText(
        body.email,
        MAX_EMAIL_LENGTH
      ).toLowerCase();

      if (!isValidEmail(email)) {
        return NextResponse.json(
          { error: "Invalid email" },
          { status: 400 }
        );
      }

      if (email !== targetUser.email) {
        const existingEmailUser =
          await prisma.user.findFirst({
            where: {
              email,
              NOT: {
                id: userId,
              },
            },
            select: {
              id: true,
            },
          });

        if (existingEmailUser) {
          return NextResponse.json(
            { error: "Email already exists" },
            { status: 409 }
          );
        }

        updateData.email = email;

        /*
         * إذا كان نظامك يعتمد على emailVerified،
         * من الأفضل إلغاء التحقق عند تغيير البريد:
         *
         * updateData.emailVerified = null;
         *
         * فعّل هذا فقط إذا كان الحقل موجودًا
         * في Prisma schema عندك.
         */
      }
    }

    if (typeof body.role !== "undefined") {
      if (
        typeof body.role !== "string" ||
        !allowedRoles.includes(
          body.role as UserRole
        )
      ) {
        return NextResponse.json(
          { error: "Invalid role" },
          { status: 400 }
        );
      }

      const role = body.role as UserRole;

      if (
        userId === currentUser.id &&
        role !== "ADMIN"
      ) {
        return NextResponse.json(
          {
            error:
              "You cannot remove your own admin role",
          },
          { status: 400 }
        );
      }

      if (
        targetUser.role === "ADMIN" &&
        role !== "ADMIN" &&
        (await isLastAdmin(targetUser.role))
      ) {
        return NextResponse.json(
          {
            error:
              "You cannot remove the last admin role",
          },
          { status: 409 }
        );
      }

      updateData.role = role;
    }

    if (
      typeof body.isBanned !== "undefined"
    ) {
      const isBanned = parseBoolean(
        body.isBanned
      );

      if (isBanned === null) {
        return NextResponse.json(
          { error: "Invalid banned value" },
          { status: 400 }
        );
      }

      if (
        userId === currentUser.id &&
        isBanned
      ) {
        return NextResponse.json(
          { error: "You cannot ban yourself" },
          { status: 400 }
        );
      }

      if (
        targetUser.role === "ADMIN" &&
        isBanned &&
        !targetUser.isBanned &&
        (await isLastAdmin(targetUser.role))
      ) {
        return NextResponse.json(
          {
            error:
              "You cannot ban the last active admin",
          },
          { status: 409 }
        );
      }

      updateData.isBanned = isBanned;
    }

    if (
      typeof body.password !== "undefined"
    ) {
      if (typeof body.password !== "string") {
        return NextResponse.json(
          { error: "Invalid password" },
          { status: 400 }
        );
      }

      const password = body.password;

      if (
        password.length <
        MIN_PASSWORD_LENGTH ||
        password.length >
        MAX_PASSWORD_LENGTH
      ) {
        return NextResponse.json(
          { error: "Invalid password" },
          { status: 400 }
        );
      }

      updateData.hashedPassword =
        await bcrypt.hash(password, 12);
    }

    if (
      Object.keys(updateData).length === 0
    ) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    /*
     * حماية إضافية في حال حدث تعارض Unique
     * بين فحص البريد وتنفيذ update.
     */
    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }

    console.error(
      "ADMIN_USER_PATCH_ERROR",
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

    const auth = await requireAdmin();

    if (
      auth.response ||
      !auth.currentUser
    ) {
      return auth.response;
    }

    const currentUser = auth.currentUser;

    const rateLimit =
      await RateLimitService.check({
        key: `admin-delete-user:${currentUser.id}`,
        limit: 20,
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

    const { userId } = await params;

    if (
      !userId ||
      typeof userId !== "string" ||
      !isValidObjectId(userId)
    ) {
      return NextResponse.json(
        { error: "Invalid user id" },
        { status: 400 }
      );
    }

    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot delete yourself" },
        { status: 400 }
      );
    }

    const targetUser =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          role: true,
          isBanned: true,
        },
      });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (
      targetUser.role === "ADMIN" &&
      !targetUser.isBanned &&
      (await isLastAdmin(targetUser.role))
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot delete the last active admin",
        },
        { status: 409 }
      );
    }

    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    /*
     * قد يفشل الحذف إذا كانت هناك علاقات
     * لا تستخدم onDelete: Cascade.
     */
    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          error:
            "User cannot be deleted because related data still exists",
        },
        { status: 409 }
      );
    }

    console.error(
      "ADMIN_USER_DELETE_ERROR",
      error
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}