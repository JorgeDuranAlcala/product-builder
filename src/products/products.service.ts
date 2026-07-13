import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AuditAction,
  CertificationEnvironment,
  CertificationStatus,
  RecordStatus,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { isWithinValidity } from '../common/utils/validity.util';
import {
  AssignProducersDto,
  CertifyProductDto,
  CreateProductWizardDto,
} from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private productInclude = {
    masterBranch: true,
    internalBranch: true,
    currency: true,
    coverages: { include: { tariffs: true, internalCoverage: true, coverageMaster: true } },
    producerAssignments: { include: { producer: true } },
    certificationRuns: true,
  };

  findAll() {
    return this.prisma.product.findMany({
      include: this.productInclude,
      orderBy: { id: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.product.findUniqueOrThrow({
      where: { id },
      include: this.productInclude,
    });
  }

  async getFullConfig(id: number) {
    const product = await this.findOne(id);
    const coverageMasters = await this.prisma.coverageMaster.findMany({
      where: { masterBranchId: product.masterBranchId },
      include: { internalCoverage: true, internalBranch: true },
    });
    return { product, coverageMasters };
  }

  async wizard(dto: CreateProductWizardDto, userId: string) {
    await this.validateWizardPrerequisites(dto);

    const mandatoryMasters = await this.prisma.coverageMaster.findMany({
      where: { masterBranchId: dto.masterBranchId, mandatory: true },
    });

    for (const mandatory of mandatoryMasters) {
      const included = dto.coverages.some(
        (c) => c.internalCoverageId === mandatory.internalCoverageId,
      );
      if (!included) {
        throw new BadRequestException(
          `Mandatory coverage internal id ${mandatory.internalCoverageId} must be included`,
        );
      }
    }

    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          masterBranchId: dto.masterBranchId,
          internalBranchId: dto.internalBranchId,
          planName: dto.planName,
          subPlanName: dto.subPlanName,
          allowsQuickEmission: dto.allowsQuickEmission ?? false,
          currencyId: dto.currencyId,
          contractValidFrom: new Date(dto.contractValidity.from),
          contractValidTo: new Date(dto.contractValidity.to),
          annualCloseMonth: dto.annualCloseMonth ?? 12,
          premiumGuaranteeDays: dto.premiumGuaranteeDays ?? 30,
          renewalFrequency: dto.renewalFrequency ?? 'ANUAL',
          renewalType: dto.renewalType ?? 'NORMAL',
          emissionType: dto.emissionType ?? 'PRORRATA',
          premiumDueFrequency: dto.premiumDueFrequency ?? 'ANUAL',
          premiumDueType: dto.premiumDueType ?? 'NORMAL',
          createdBy: userId,
          coverages: {
            create: dto.coverages.map((c) => ({
              internalCoverageId: c.internalCoverageId,
              coverageMasterId: c.coverageMasterId,
              name: c.name,
              validFrom: new Date(c.validFrom),
              validTo: new Date(c.validTo),
              createdBy: userId,
              tariffs: {
                create: {
                  validFrom: new Date(c.tariff.validFrom ?? c.validFrom),
                  validTo: new Date(c.tariff.validTo ?? c.validTo),
                  minSumInsured: c.tariff.minSumInsured,
                  maxSumInsured: c.tariff.maxSumInsured,
                  premium: c.tariff.premium,
                  createdBy: userId,
                },
              },
            })),
          },
        },
        include: this.productInclude,
      });
      return created;
    });

    await this.audit.log({
      userId,
      action: AuditAction.WIZARD_CREATE,
      entityType: 'Product',
      entityId: product.id,
      productId: product.id,
      summary: `Created product plan ${product.planName}`,
      after: product,
    });

    return product;
  }

  async updateFullConfig(
    id: number,
    dto: CreateProductWizardDto,
    userId: string,
  ) {
    const before = await this.findOne(id);
    await this.validateWizardPrerequisites(dto);

    const product = await this.prisma.$transaction(async (tx) => {
      await tx.productCoverageTariff.deleteMany({
        where: { productCoverage: { productId: id } },
      });
      await tx.productCoverage.deleteMany({ where: { productId: id } });

      return tx.product.update({
        where: { id },
        data: {
          masterBranchId: dto.masterBranchId,
          internalBranchId: dto.internalBranchId,
          planName: dto.planName,
          subPlanName: dto.subPlanName,
          allowsQuickEmission: dto.allowsQuickEmission ?? false,
          currencyId: dto.currencyId,
          contractValidFrom: new Date(dto.contractValidity.from),
          contractValidTo: new Date(dto.contractValidity.to),
          annualCloseMonth: dto.annualCloseMonth ?? 12,
          premiumGuaranteeDays: dto.premiumGuaranteeDays ?? 30,
          renewalFrequency: dto.renewalFrequency ?? 'ANUAL',
          renewalType: dto.renewalType ?? 'NORMAL',
          emissionType: dto.emissionType ?? 'PRORRATA',
          premiumDueFrequency: dto.premiumDueFrequency ?? 'ANUAL',
          premiumDueType: dto.premiumDueType ?? 'NORMAL',
          updatedBy: userId,
          coverages: {
            create: dto.coverages.map((c) => ({
              internalCoverageId: c.internalCoverageId,
              coverageMasterId: c.coverageMasterId,
              name: c.name,
              validFrom: new Date(c.validFrom),
              validTo: new Date(c.validTo),
              createdBy: userId,
              tariffs: {
                create: {
                  validFrom: new Date(c.tariff.validFrom ?? c.validFrom),
                  validTo: new Date(c.tariff.validTo ?? c.validTo),
                  minSumInsured: c.tariff.minSumInsured,
                  maxSumInsured: c.tariff.maxSumInsured,
                  premium: c.tariff.premium,
                  createdBy: userId,
                },
              },
            })),
          },
        },
        include: this.productInclude,
      });
    });

    await this.audit.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'Product',
      entityId: id,
      productId: id,
      summary: `Updated full config for product ${product.planName}`,
      before,
      after: product,
    });

    return product;
  }

  async assignProducers(id: number, dto: AssignProducersDto, userId: string) {
    await this.findOne(id);

    const assignments = await this.prisma.$transaction(async (tx) => {
      if (dto.assignToAll) {
        return [
          await tx.producerProductAssignment.create({
            data: {
              productId: id,
              scope: 'TODOS',
              validFrom: new Date(),
              createdBy: userId,
            },
            include: { producer: true },
          }),
        ];
      }

      return Promise.all(
        dto.producerIds.map((producerId) =>
          tx.producerProductAssignment.create({
            data: {
              productId: id,
              producerId,
              scope: 'PRODUCTOR',
              validFrom: new Date(),
              createdBy: userId,
            },
            include: { producer: true },
          }),
        ),
      );
    });

    await this.audit.log({
      userId,
      action: AuditAction.ASSIGN_PRODUCER,
      entityType: 'Product',
      entityId: id,
      productId: id,
      summary: `Assigned producers to product ${id}`,
      after: assignments,
    });

    return assignments;
  }

  async certify(id: number, dto: CertifyProductDto, userId: string) {
    await this.findOne(id);

    const run = await this.prisma.certificationRun.upsert({
      where: {
        productId_environment: {
          productId: id,
          environment: dto.environment as CertificationEnvironment,
        },
      },
      create: {
        productId: id,
        environment: dto.environment as CertificationEnvironment,
        status: dto.status as CertificationStatus,
        notes: dto.notes,
        certifiedBy: userId,
        certifiedAt: dto.status === 'PASSED' ? new Date() : null,
        createdBy: userId,
      },
      update: {
        status: dto.status as CertificationStatus,
        notes: dto.notes,
        certifiedBy: userId,
        certifiedAt: dto.status === 'PASSED' ? new Date() : null,
        updatedBy: userId,
      },
    });

    await this.audit.log({
      userId,
      action: AuditAction.CERTIFY,
      entityType: 'CertificationRun',
      entityId: run.id,
      productId: id,
      summary: `Certification ${dto.environment}: ${dto.status}`,
      after: run,
    });

    return run;
  }

  async emitPreview(id: number, userId: string) {
    const product = await this.findOne(id);
    const now = new Date();
    const issues: string[] = [];

    if (product.status !== RecordStatus.VIGENTE) {
      issues.push('Product is not VIGENTE');
    }
    if (
      !isWithinValidity(
        product.contractValidFrom,
        product.contractValidTo,
        now,
      )
    ) {
      issues.push('Product contract is not within validity');
    }

    const coverageMasters = await this.prisma.coverageMaster.count({
      where: { masterBranchId: product.masterBranchId },
    });
    if (coverageMasters === 0) {
      issues.push('No coverage master configured (SISIP step 5)');
    }

    if (product.coverages.length === 0) {
      issues.push('Product has no coverages');
    }

    const activeAssignment = product.producerAssignments.find(
      (a) => a.status === RecordStatus.VIGENTE,
    );
    if (!activeAssignment) {
      issues.push('No active producer assignment');
    }

    const qaCert = product.certificationRuns.find(
      (c) => c.environment === 'QA' && c.status === 'PASSED',
    );
    const prodCert = product.certificationRuns.find(
      (c) => c.environment === 'PRODUCTION' && c.status === 'PASSED',
    );
    if (!qaCert) issues.push('QA certification not passed');
    if (!prodCert) issues.push('Production certification not passed');

    const emitible = issues.length === 0;

    await this.audit.log({
      userId,
      action: AuditAction.EMIT_PREVIEW,
      entityType: 'Product',
      entityId: id,
      productId: id,
      summary: emitible
        ? `Product ${product.planName} is emitible`
        : `Product ${product.planName} is NOT emitible`,
      after: { emitible, issues, productId: id },
    });

    return {
      emitible,
      issues,
      product: {
        id: product.id,
        planName: product.planName,
        masterBranch: product.masterBranch,
        status: product.status,
      },
    };
  }

  private async validateWizardPrerequisites(dto: CreateProductWizardDto) {
    const [masterBranch, internalBranch, currency] = await Promise.all([
      this.prisma.masterBranch.findUnique({ where: { id: dto.masterBranchId } }),
      this.prisma.internalBranch.findUnique({ where: { id: dto.internalBranchId } }),
      this.prisma.currency.findUnique({ where: { id: dto.currencyId } }),
    ]);

    if (!masterBranch) {
      throw new BadRequestException('Master branch required (SISIP step 1)');
    }
    if (!internalBranch) {
      throw new BadRequestException('Internal branch required (SISIP step 2)');
    }
    if (!currency) {
      throw new BadRequestException('Currency not found');
    }

    const coverageMasterCount = await this.prisma.coverageMaster.count({
      where: { masterBranchId: dto.masterBranchId },
    });
    if (coverageMasterCount === 0) {
      throw new BadRequestException(
        'Coverage master required before creating product (SISIP step 5)',
      );
    }

    for (const coverage of dto.coverages) {
      const internalCoverage = await this.prisma.internalCoverage.findUnique({
        where: { id: coverage.internalCoverageId },
        include: { tariffs: true },
      });
      if (!internalCoverage) {
        throw new BadRequestException(
          `Internal coverage ${coverage.internalCoverageId} not found`,
        );
      }
      if (internalCoverage.tariffs.length === 0) {
        throw new BadRequestException(
          `Internal tariff required for coverage ${coverage.internalCoverageId}`,
        );
      }
      if (coverage.tariff.minSumInsured > coverage.tariff.maxSumInsured) {
        throw new BadRequestException('minSumInsured cannot exceed maxSumInsured');
      }
    }
  }
}
