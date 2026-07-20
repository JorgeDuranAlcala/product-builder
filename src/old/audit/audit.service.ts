import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogEntry {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string | number;
  productId?: number;
  summary: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntry) {
    return this.prisma.configAuditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: String(entry.entityId),
        productId: entry.productId,
        summary: entry.summary,
        before: entry.before as Prisma.InputJsonValue | undefined,
        after: entry.after as Prisma.InputJsonValue | undefined,
        metadata: entry.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async findAll(filters: {
    userId?: string;
    productId?: number;
    entityType?: string;
    action?: AuditAction;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const where: Prisma.ConfigAuditLogWhereInput = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.productId) where.productId = filters.productId;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.action) where.action = filters.action;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = filters.from;
      if (filters.to) where.createdAt.lte = filters.to;
    }

    const [data, total] = await Promise.all([
      this.prisma.configAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.configAuditLog.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async findByProduct(productId: number, page = 1, limit = 20) {
    return this.findAll({ productId, page, limit });
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    return this.findAll({ userId, page, limit });
  }

  async findOne(id: string) {
    return this.prisma.configAuditLog.findUniqueOrThrow({ where: { id } });
  }
}
