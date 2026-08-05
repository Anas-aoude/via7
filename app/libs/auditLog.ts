import {
  AuditAction,
  AuditTargetType,
  Prisma,
} from "@prisma/client";

import prisma from "@/app/libs/prismadb";

interface CreateAuditLogParams {
  userId?: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
}

export async function createAuditLog({
  userId,
  action,
  targetType,
  targetId,
  metadata,
}: CreateAuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        targetType,
        targetId,
        metadata: metadata ?? undefined,
      },
    });
  } catch (error) {
    console.error("Audit Log Error:", error);
  }
}