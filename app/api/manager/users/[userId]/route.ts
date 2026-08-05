import { NextResponse } from "next/server";
import {
  AuditAction,
  AuditTargetType,
  Prisma,
  UserRole,
} from "@prisma/client";

import { createAuditLog } from "@/app/libs/auditLog";
import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/users/getCurrentUser";
import { RateLimitService } from "@/app/services/rate-limit";
import { verifyRequestOrigin } from "@/app/libs/security/verifyRequestOrigin";

interface IParams {
  userId?: string;
}

const manageableRoles: UserRole[] = [
  UserRole.USER,
  UserRole.HOST,
  UserRole.VIP_HOST,
  UserRole.AGENCY,
];

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
    currentUser.role !== UserRole.MANAGER ||
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

const createManagerAuditLog = async (
  data: Parameters<typeof createAuditLog>[0]
) => {
  try {
    await createAuditLog(data);
  } catch (error) {
    console.error(
      "MANAGER_USER_AUDIT_LOG_ERROR",
      error
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
        key: `manager-update-user:${currentUser.id}`,
        limit: 40,
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
        {
          error:
            "You cannot update yourself",
        },
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

    if (
      !manageableRoles.includes(
        targetUser.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot manage this user",
        },
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

    let role: UserRole | undefined;

    if (typeof body.role !== "undefined") {
      if (
        typeof body.role !== "string" ||
        !manageableRoles.includes(
          body.role as UserRole
        )
      ) {
        return NextResponse.json(
          { error: "Invalid role" },
          { status: 400 }
        );
      }

      role = body.role as UserRole;
    }

    let isBanned: boolean | undefined;

    if (
      typeof body.isBanned !== "undefined"
    ) {
      if (
        typeof body.isBanned !== "boolean"
      ) {
        return NextResponse.json(
          { error: "Invalid ban status" },
          { status: 400 }
        );
      }

      isBanned = body.isBanned;
    }

    const updateData: Prisma.UserUpdateInput =
      {};

    if (
      typeof role !== "undefined" &&
      role !== targetUser.role
    ) {
      updateData.role = role;
    }

    if (
      typeof isBanned !== "undefined" &&
      isBanned !== targetUser.isBanned
    ) {
      updateData.isBanned = isBanned;
    }

    if (
      Object.keys(updateData).length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "No changes were provided",
        },
        { status: 400 }
      );
    }

    /*
     * حماية إضافية من Race Condition:
     * نتأكد داخل update أن المستخدم لا يزال
     * ضمن الأدوار المسموح للـ Manager بإدارتها.
     */
    const updateResult =
      await prisma.user.updateMany({
        where: {
          id: userId,
          role: {
            in: manageableRoles,
          },
        },
        data: updateData,
      });

    if (updateResult.count === 0) {
      return NextResponse.json(
        {
          error:
            "User can no longer be managed",
        },
        { status: 409 }
      );
    }

    const user =
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
          createdAt: true,
          updatedAt: true,
        },
      });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (
      typeof isBanned !== "undefined" &&
      isBanned !== targetUser.isBanned
    ) {
      await createManagerAuditLog({
        userId: currentUser.id,
        action: isBanned
          ? AuditAction.MANAGER_BAN_USER
          : AuditAction.MANAGER_UNBAN_USER,
        targetType: AuditTargetType.USER,
        targetId: user.id,
        metadata: {
          targetName: user.name,
          targetEmail: user.email,
          previousIsBanned:
            targetUser.isBanned,
          newIsBanned: user.isBanned,
          previousRole: targetUser.role,
          newRole: user.role,
        },
      });
    }

    if (
      typeof role !== "undefined" &&
      role !== targetUser.role
    ) {
      await createManagerAuditLog({
        userId: currentUser.id,
        action:
          AuditAction.MANAGER_UPDATE_USER_ROLE,
        targetType: AuditTargetType.USER,
        targetId: user.id,
        metadata: {
          targetName: user.name,
          targetEmail: user.email,
          previousRole: targetUser.role,
          newRole: user.role,
        },
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.error(
      "MANAGER_USER_PATCH_ERROR",
      error
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}