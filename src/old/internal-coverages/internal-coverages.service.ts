import { BadRequestException, Injectable } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInternalCoverageDto,
  InternalCoverageWithTariffDto,
} from './dto/internal-coverage.dto';

@Injectable()
export class InternalCoveragesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll() {
    return this.prisma.internalCoverage.findMany({
      include: { tariffs: true, internalBranch: true, masterCoverage: true },
    });
  }

  async findOne(id: number) {
    return this.prisma.internalCoverage.findUniqueOrThrow({
      where: { id },
      include: { tariffs: true, internalBranch: true, masterCoverage: true },
    });
  }

  async create(dto: CreateInternalCoverageDto, userId: string) {
    await this.validateInternalBranch(dto.internalBranchId);
    await this.validateMasterCoverage(dto.masterCoverageId);

    const coverage = await this.prisma.internalCoverage.create({
      data: {
        code: dto.code,
        internalBranchId: dto.internalBranchId,
        masterCoverageId: dto.masterCoverageId,
        name: dto.name,
        coverageGroup: dto.coverageGroup,
        sumInsuredRequiredAtLevel: dto.sumInsuredRequiredAtLevel ?? false,
        treatmentType: dto.treatmentType,
        appliesWhen: dto.appliesWhen,
        calculationForm: dto.calculationForm ?? 'SOBPECER',
        sumForm: dto.sumForm ?? 'SOBPECER',
        createdBy: userId,
      },
    });

    await this.audit.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'InternalCoverage',
      entityId: coverage.id,
      summary: `Created internal coverage ${coverage.name}`,
      after: coverage,
    });

    return coverage;
  }

  async createWithTariff(dto: InternalCoverageWithTariffDto, userId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      await this.validateInternalBranch(dto.coverage.internalBranchId);
      await this.validateMasterCoverage(dto.coverage.masterCoverageId);

      const coverage = await tx.internalCoverage.create({
        data: {
          code: dto.coverage.code,
          internalBranchId: dto.coverage.internalBranchId,
          masterCoverageId: dto.coverage.masterCoverageId,
          name: dto.coverage.name,
          coverageGroup: dto.coverage.coverageGroup,
          sumInsuredRequiredAtLevel:
            dto.coverage.sumInsuredRequiredAtLevel ?? false,
          treatmentType: dto.coverage.treatmentType,
          appliesWhen: dto.coverage.appliesWhen,
          calculationForm: dto.coverage.calculationForm ?? 'SOBPECER',
          sumForm: dto.coverage.sumForm ?? 'SOBPECER',
          createdBy: userId,
        },
      });

      const tariff = await tx.internalTariff.create({
        data: {
          code: dto.tariff.code,
          internalCoverageId: coverage.id,
          masterTariffId: dto.tariff.masterTariffId,
          name: dto.tariff.name,
          tariffGroup: dto.tariff.tariffGroup,
          treatmentType: dto.tariff.treatmentType,
          appliesWhen: dto.tariff.appliesWhen,
          calculationForm: dto.tariff.calculationForm ?? 'SOBPECER',
          sumForm: dto.tariff.sumForm ?? 'SOBPECER',
          createdBy: userId,
        },
      });

      return { coverage, tariff };
    });

    await this.audit.log({
      userId,
      action: AuditAction.WIZARD_CREATE,
      entityType: 'InternalCoverage',
      entityId: result.coverage.id,
      summary: `Created internal coverage ${result.coverage.name} with tariff`,
      after: result,
    });

    return result;
  }

  private async validateInternalBranch(id: number) {
    const branch = await this.prisma.internalBranch.findUnique({ where: { id } });
    if (!branch) {
      throw new BadRequestException(
        'Internal branch must exist (SISIP step 2)',
      );
    }
  }

  private async validateMasterCoverage(id: number) {
    const coverage = await this.prisma.masterCoverage.findUnique({ where: { id } });
    if (!coverage) {
      throw new BadRequestException(
        'Master coverage must exist (SISIP step 1)',
      );
    }
  }
}
