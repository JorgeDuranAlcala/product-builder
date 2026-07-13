import { BadRequestException, Injectable } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCoverageMasterDto } from './dto/create-coverage-master.dto';

@Injectable()
export class CoverageMasterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAll() {
    return this.prisma.coverageMaster.findMany({
      include: {
        masterBranch: true,
        masterCoverage: true,
        internalBranch: true,
        internalCoverage: true,
        currency: true,
        reinsuranceContract: true,
        reinsuranceBranch: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.coverageMaster.findUniqueOrThrow({
      where: { id },
      include: {
        masterBranch: true,
        masterCoverage: true,
        internalBranch: true,
        internalCoverage: true,
        currency: true,
        reinsuranceContract: true,
        reinsuranceBranch: true,
      },
    });
  }

  async create(dto: CreateCoverageMasterDto, userId: string) {
    await this.validateDependencies(dto);

    const record = await this.prisma.coverageMaster.create({
      data: {
        masterBranchId: dto.masterBranchId,
        masterCoverageId: dto.masterCoverageId,
        currencyId: dto.currencyId,
        internalBranchId: dto.internalBranchId,
        internalCoverageId: dto.internalCoverageId,
        dependsOnCoverageId: dto.dependsOnCoverageId,
        compareToCoverageId: dto.compareToCoverageId,
        mandatory: dto.mandatory ?? false,
        reinsuranceContractId: dto.reinsuranceContractId,
        reinsuranceBranchId: dto.reinsuranceBranchId,
        pcndBranchCode: dto.pcndBranchCode,
        pcndCoverageCode: dto.pcndCoverageCode,
        reinsuranceSumRule: dto.reinsuranceSumRule,
        receiptSumRule: dto.receiptSumRule,
        calculationRoutine: dto.calculationRoutine ?? true,
        inputProc: dto.inputProc ?? false,
        outputProc: dto.outputProc ?? false,
        status: dto.status,
        createdBy: userId,
      },
      include: {
        masterBranch: true,
        masterCoverage: true,
        internalBranch: true,
        internalCoverage: true,
      },
    });

    await this.audit.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'CoverageMaster',
      entityId: record.id,
      summary: `Created coverage master for branch ${record.masterBranch.name}`,
      after: record,
    });

    return record;
  }

  private async validateDependencies(dto: CreateCoverageMasterDto) {
    const [masterBranch, masterCoverage, internalBranch, internalCoverage] =
      await Promise.all([
        this.prisma.masterBranch.findUnique({ where: { id: dto.masterBranchId } }),
        this.prisma.masterCoverage.findUnique({ where: { id: dto.masterCoverageId } }),
        this.prisma.internalBranch.findUnique({ where: { id: dto.internalBranchId } }),
        this.prisma.internalCoverage.findUnique({ where: { id: dto.internalCoverageId } }),
      ]);

    if (!masterBranch) {
      throw new BadRequestException('Master branch required (SISIP step 1)');
    }
    if (!masterCoverage) {
      throw new BadRequestException('Master coverage required (SISIP step 1)');
    }
    if (!internalBranch) {
      throw new BadRequestException('Internal branch required (SISIP step 2)');
    }
    if (!internalCoverage) {
      throw new BadRequestException(
        'Internal coverage required (SISIP steps 3-4)',
      );
    }

    const tariff = await this.prisma.internalTariff.findFirst({
      where: { internalCoverageId: dto.internalCoverageId },
    });
    if (!tariff) {
      throw new BadRequestException(
        'Internal tariff required before coverage master (SISIP step 4)',
      );
    }
  }
}
