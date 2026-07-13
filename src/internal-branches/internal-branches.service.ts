import { BadRequestException, Injectable } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInternalBranchDto,
  InternalBranchSetupDto,
} from './dto/internal-branch.dto';

@Injectable()
export class InternalBranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll() {
    return this.prisma.internalBranch.findMany({
      include: { counters: true, masks: { include: { segments: true } }, masterBranch: true },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.internalBranch.findUniqueOrThrow({
      where: { id },
      include: {
        counters: true,
        masks: { include: { segments: true } },
        masterBranch: true,
      },
    });
  }

  async create(dto: CreateInternalBranchDto, userId: string) {
    const master = await this.prisma.masterBranch.findUnique({
      where: { id: dto.masterBranchId },
    });
    if (!master) {
      throw new BadRequestException(
        'Master branch must exist before creating internal branch (SISIP step 1)',
      );
    }

    const branch = await this.prisma.internalBranch.create({
      data: {
        code: dto.code,
        name: dto.name,
        masterBranchId: dto.masterBranchId,
        group: dto.group,
        imageHandling: dto.imageHandling ?? false,
        status: dto.status,
        createdBy: userId,
      },
    });

    await this.audit.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'InternalBranch',
      entityId: branch.id,
      summary: `Created internal branch ${branch.name}`,
      after: branch,
    });

    return branch;
  }

  async setup(id: number, dto: InternalBranchSetupDto, userId: string) {
    const branch = await this.findOne(id);

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.documentCounter.deleteMany({ where: { internalBranchId: id } });
      await tx.documentMask.deleteMany({ where: { internalBranchId: id } });

      const counters = await Promise.all(
        dto.counters.map((c) =>
          tx.documentCounter.create({
            data: {
              internalBranchId: id,
              concept: c.concept,
              value: c.value,
              createdBy: userId,
            },
          }),
        ),
      );

      const masks = [];
      for (const mask of dto.masks) {
        const created = await tx.documentMask.create({
          data: {
            internalBranchId: id,
            type: mask.type,
            createdBy: userId,
            segments: {
              create: mask.segments.map((s) => ({
                position: s.position,
                token: s.token,
                useSeparator: s.useSeparator ?? true,
                separator: s.separator ?? '-',
              })),
            },
          },
          include: { segments: true },
        });
        masks.push(created);
      }

      return { branch, counters, masks };
    });

    await this.audit.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'InternalBranch',
      entityId: id,
      summary: `Setup counters and masks for internal branch ${branch.name}`,
      after: result,
    });

    return result;
  }
}
