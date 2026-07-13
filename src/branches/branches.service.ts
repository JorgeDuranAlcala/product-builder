import { Injectable } from '@nestjs/common';
import { AuditAction, RecordStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto, CreateBranchWizardDto, MasterTariffDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll() {
    return this.prisma.masterBranch.findMany({
      include: { coverages: { include: { tariffs: true } } },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.masterBranch.findUniqueOrThrow({
      where: { id },
      include: { coverages: { include: { tariffs: true } } },
    });
  }

  async create(dto: CreateBranchDto, userId: string) {
    const branch = await this.prisma.masterBranch.create({
      data: {
        code: dto.code,
        name: dto.name,
        alias1: dto.alias1,
        alias2: dto.alias2,
        status: dto.status ?? RecordStatus.VIGENTE,
        createdBy: userId,
      },
    });
    await this.audit.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'MasterBranch',
      entityId: branch.id,
      summary: `Created master branch ${branch.name}`,
      after: branch,
    });
    return branch;
  }

  async update(id: number, dto: UpdateBranchDto, userId: string) {
    const before = await this.findOne(id);
    const branch = await this.prisma.masterBranch.update({
      where: { id },
      data: { ...dto, updatedBy: userId },
    });
    await this.audit.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'MasterBranch',
      entityId: id,
      summary: `Updated master branch ${branch.name}`,
      before,
      after: branch,
    });
    return branch;
  }

  async wizard(dto: CreateBranchWizardDto, userId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const branch = await tx.masterBranch.create({
        data: {
          code: dto.code,
          name: dto.name,
          alias1: dto.alias1,
          alias2: dto.alias2,
          status: dto.status ?? RecordStatus.VIGENTE,
          createdBy: userId,
        },
      });

      const coverages = [];
      for (const cov of dto.coverages) {
        const coverage = await tx.masterCoverage.create({
          data: {
            masterBranchId: branch.id,
            code: cov.code,
            name: cov.name,
            validFrom: new Date(cov.validFrom),
            validTo: new Date(cov.validTo),
            status: cov.status ?? RecordStatus.VIGENTE,
            createdBy: userId,
            tariffs: {
              create: cov.tariffs.map((t: MasterTariffDto) => ({
                code: t.code,
                name: t.name,
                validFrom: new Date(t.validFrom),
                validTo: new Date(t.validTo),
                status: t.status ?? RecordStatus.VIGENTE,
                createdBy: userId,
              })),
            },
          },
          include: { tariffs: true },
        });
        coverages.push(coverage);
      }

      return { branch, coverages };
    });

    await this.audit.log({
      userId,
      action: AuditAction.WIZARD_CREATE,
      entityType: 'MasterBranch',
      entityId: result.branch.id,
      summary: `Wizard created branch ${result.branch.name} with ${result.coverages.length} coverages`,
      after: result,
    });

    return result;
  }
}
