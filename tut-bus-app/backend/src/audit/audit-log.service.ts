import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  /** Records one admin action. Never throws - a logging hiccup must never
   * break the actual admin action it is recording, so callers can fire this
   * without awaiting or with a trailing .catch(() => undefined). */
  async log(
    admin: { id: string } | undefined,
    action: string,
    targetType: string,
    targetId: string | undefined,
    summary: string,
  ) {
    return this.prisma.auditLog.create({
      data: {
        action,
        targetType,
        targetId,
        summary,
        adminId: admin?.id,
      },
    });
  }

  async list(params?: { limit?: number; cursor?: string; targetType?: string; action?: string }) {
    return this.prisma.auditLog.findMany({
      where: {
        targetType: params?.targetType,
        action: params?.action,
      },
      include: { admin: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: params?.limit ?? 100,
      ...(params?.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    });
  }
}
