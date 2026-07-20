import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CommercialChannelType,
  DocumentType,
  Prisma,
  ProductStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  applyBranchFlagsOnCreate,
  defaultFlowSteps,
  defaultFormFields,
  defaultPlans,
  validateSubmissionGuardrails,
} from '../common/utils/branch-defaults.util';
import {
  calculateCommercialPremium,
  isLoadFactorValid,
} from '../common/utils/commercial-premium.util';
import {
  ALLOWED_TRANSITIONS,
} from '../common/utils/product-status.util';
import { assertDeletable } from '../common/guards/product-mutable.guard';
import {
  serializeActuarial,
  serializeCoverage,
  serializePlan,
} from '../common/utils/serialize.util';
import {
  CreateProductDto,
  ReplaceActuarialDto,
  ReplaceCoveragesDto,
  ReplaceEmissionConfigDto,
  ReplaceLegalDto,
  ReplacePlansDto,
  SisipConfigDto,
  UpdateProductDto,
  WorkflowApproveDto,
  WorkflowTransitionDto,
} from './dto/product.dto';

const FULL_PRODUCT_INCLUDE = {
  coverages: { orderBy: { sortOrder: 'asc' as const } },
  actuarialData: { include: { ratingVariables: { orderBy: { sortOrder: 'asc' as const } } } },
  exclusions: { orderBy: { sortOrder: 'asc' as const } },
  legalDocuments: true,
  commercialChannels: true,
  requiredDocuments: { orderBy: { sortOrder: 'asc' as const } },
  productPlans: { orderBy: { sortOrder: 'asc' as const } },
  flowStepConfigs: { orderBy: { sortOrder: 'asc' as const } },
  formFields: { orderBy: { sortOrder: 'asc' as const } },
  stateHistory: { orderBy: { changedAt: 'asc' as const } },
  sisipConfig: true,
} satisfies Prisma.ProductInclude;

const LIST_PRODUCT_INCLUDE = {
  coverages: {
    select: { id: true, name: true, isBasicMandatory: true },
    orderBy: { sortOrder: 'asc' as const },
  },
  actuarialData: {
    select: {
      commercialPremium: true,
      purePremium: true,
    },
  },
  sisipConfig: true,
  _count: {
    select: { exclusions: true, stateHistory: true },
  },
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const products = await this.prisma.product.findMany({
      include: LIST_PRODUCT_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });
    return products.map((p) => this.serializeListProduct(p));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: FULL_PRODUCT_INCLUDE,
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return this.serializeFullProduct(product);
  }

  async create(dto: CreateProductDto) {
    const code = dto.internalCode.toUpperCase();
    const existing = await this.prisma.product.findUnique({
      where: { internalCode: code },
    });
    if (existing) {
      throw new ConflictException('Ya existe un producto con ese internalCode');
    }

    const branchFlags = applyBranchFlagsOnCreate(dto.branch);

    const product = await this.prisma.product.create({
      data: {
        commercialName: dto.commercialName.trim().replace(/\s+/g, ' '),
        internalCode: code,
        branch: dto.branch,
        currency: dto.currency,
        emissionType: dto.emissionType,
        status: ProductStatus.DRAFT,
        isImmutable: false,
        subPlanCode: dto.subPlanCode?.trim() || null,
        vigenciaInicio: dto.vigenciaInicio ? new Date(dto.vigenciaInicio) : null,
        vigenciaFin: dto.vigenciaFin ? new Date(dto.vigenciaFin) : null,
        allowsQuickEmission: dto.allowsQuickEmission ?? false,
        renewalFrequency: dto.renewalFrequency,
        renewalType: dto.renewalType,
        premiumGuaranteeDays: dto.premiumGuaranteeDays ?? 30,
        annualClosingMonth: dto.annualClosingMonth ?? 12,
        ...branchFlags,
        stateHistory: {
          create: {
            toStatus: ProductStatus.DRAFT,
            comment: 'Producto creado',
          },
        },
      },
      include: FULL_PRODUCT_INCLUDE,
    });

    return this.serializeFullProduct(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.ensureExists(id);

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.commercialName !== undefined && {
          commercialName: dto.commercialName.trim().replace(/\s+/g, ' '),
        }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.emissionType !== undefined && { emissionType: dto.emissionType }),
        ...(dto.subPlanCode !== undefined && {
          subPlanCode: dto.subPlanCode?.trim() || null,
        }),
        ...(dto.vigenciaInicio !== undefined && {
          vigenciaInicio: dto.vigenciaInicio ? new Date(dto.vigenciaInicio) : null,
        }),
        ...(dto.vigenciaFin !== undefined && {
          vigenciaFin: dto.vigenciaFin ? new Date(dto.vigenciaFin) : null,
        }),
        ...(dto.allowsQuickEmission !== undefined && {
          allowsQuickEmission: dto.allowsQuickEmission,
        }),
        ...(dto.renewalFrequency !== undefined && {
          renewalFrequency: dto.renewalFrequency,
        }),
        ...(dto.renewalType !== undefined && { renewalType: dto.renewalType }),
        ...(dto.premiumGuaranteeDays !== undefined && {
          premiumGuaranteeDays: dto.premiumGuaranteeDays,
        }),
        ...(dto.annualClosingMonth !== undefined && {
          annualClosingMonth: dto.annualClosingMonth,
        }),
      },
      include: FULL_PRODUCT_INCLUDE,
    });

    return this.serializeFullProduct(product);
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    assertDeletable(product.status);
    await this.prisma.product.delete({ where: { id } });
    return { deleted: true };
  }

  async listCoverages(productId: string) {
    await this.ensureExists(productId);
    const coverages = await this.prisma.coverage.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    });
    return coverages.map(serializeCoverage);
  }

  async replaceCoverages(productId: string, dto: ReplaceCoveragesDto) {
    await this.ensureExists(productId);

    if (!dto.coverages.length) {
      throw new BadRequestException('Debe existir al menos una cobertura');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.coverage.deleteMany({ where: { productId } });
      for (const [index, c] of dto.coverages.entries()) {
        await tx.coverage.create({
          data: {
            productId,
            name: c.name.trim(),
            description: c.description?.trim() || null,
            sortOrder: c.sortOrder ?? index,
            isBasicMandatory: c.isBasicMandatory ?? false,
            insuredSumFixed: c.insuredSumFixed ?? c.insuredSumMin ?? null,
            insuredSumMin: c.insuredSumMin ?? null,
            insuredSumMax: c.insuredSumMax ?? null,
            deductibleType: c.deductibleType ?? null,
            deductibleValue: c.deductibleValue ?? null,
            waitingPeriodDays: c.waitingPeriodDays ?? 0,
            tariffPremium: c.tariffPremium ?? null,
            dependsOnCoverageName: c.dependsOnCoverageName ?? null,
            reinsuranceContractCode: c.reinsuranceContractCode ?? null,
            reinsuranceContractName: c.reinsuranceContractName ?? null,
            reinsuranceBranchCode: c.reinsuranceBranchCode ?? null,
            vigenciaDesde: c.vigenciaDesde ? new Date(c.vigenciaDesde) : null,
            vigenciaHasta: c.vigenciaHasta ? new Date(c.vigenciaHasta) : null,
            coberturaInternaCode: c.coberturaInternaCode ?? null,
            tarifaInternaCode: c.tarifaInternaCode ?? null,
            treatmentType: c.treatmentType ?? null,
            calculationService: c.calculationService ?? null,
          },
        });
      }
    });

    const coverages = await this.prisma.coverage.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    });
    return coverages.map(serializeCoverage);
  }

  async createCoverage(productId: string, dto: ReplaceCoveragesDto['coverages'][0]) {
    await this.ensureExists(productId);
    const coverage = await this.prisma.coverage.create({
      data: {
        productId,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        sortOrder: dto.sortOrder ?? 0,
        isBasicMandatory: dto.isBasicMandatory ?? false,
        insuredSumFixed: dto.insuredSumFixed ?? null,
        deductibleType: dto.deductibleType ?? null,
        deductibleValue: dto.deductibleValue ?? null,
        waitingPeriodDays: dto.waitingPeriodDays ?? 0,
        tariffPremium: dto.tariffPremium ?? null,
      },
    });
    return serializeCoverage(coverage);
  }

  async deleteCoverage(productId: string, coverageId: string) {
    await this.ensureExists(productId);
    const coverage = await this.prisma.coverage.findFirst({
      where: { id: coverageId, productId },
    });
    if (!coverage) {
      throw new NotFoundException('Cobertura no encontrada');
    }
    await this.prisma.coverage.delete({ where: { id: coverageId } });
    return { deleted: true };
  }

  async getPlans(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        coverages: { select: { id: true, name: true }, orderBy: { sortOrder: 'asc' } },
        productPlans: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const coverages = product.coverages;
    const plans =
      product.productPlans.length > 0
        ? product.productPlans.map((p) => this.toPlanResponse(p))
        : defaultPlans(product.branch, coverages);

    return {
      productId: product.id,
      branch: product.branch,
      coverages,
      plans,
    };
  }

  async replacePlans(productId: string, dto: ReplacePlansDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { coverages: true },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const coverageMap = new Map(product.coverages.map((c) => [c.id, c.name]));

    for (const plan of dto.plans) {
      for (const coverageId of plan.coverageIds) {
        if (!coverageMap.has(coverageId)) {
          throw new BadRequestException(
            `La cobertura ${coverageId} no pertenece a este producto.`,
          );
        }
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.productPlan.deleteMany({ where: { productId } });
      for (const plan of dto.plans) {
        const coverageLabels = plan.coverageIds.map(
          (id) => coverageMap.get(id)!,
        );
        await tx.productPlan.create({
          data: {
            productId,
            name: plan.name,
            description: plan.description ?? null,
            badge: plan.badge ?? null,
            priceFactor: plan.priceFactor,
            isRecommended: plan.isRecommended,
            coverageIds: plan.coverageIds,
            coverageLabels,
            sortOrder: plan.sortOrder,
          },
        });
      }
    });

    return this.getPlans(productId);
  }

  async replaceActuarial(productId: string, dto: ReplaceActuarialDto) {
    await this.ensureExists(productId);

    if (
      !isLoadFactorValid(
        dto.administrativeExpenses,
        dto.commissions,
        dto.profitMargin,
      )
    ) {
      throw new BadRequestException(
        'La suma de gastos administrativos, comisiones y utilidad debe ser menor a 100%.',
      );
    }

    const commercialPremium = calculateCommercialPremium(
      dto.purePremium,
      dto.administrativeExpenses,
      dto.commissions,
      dto.profitMargin,
    );

    const actuarial = await this.prisma.$transaction(async (tx) => {
      await tx.actuarialData.deleteMany({ where: { productId } });
      return tx.actuarialData.create({
        data: {
          productId,
          purePremium: dto.purePremium,
          administrativeExpenses: dto.administrativeExpenses,
          commissions: dto.commissions,
          profitMargin: dto.profitMargin,
          commercialPremium,
          actuaryName: dto.actuaryName.trim(),
          actuaryCedula: dto.actuaryCedula.trim(),
          actuarySudeasegNumber: dto.actuarySudeasegNumber.trim(),
          technicalNoteUrl: dto.technicalNoteUrl ?? null,
          ratingVariables: {
            create: dto.ratingVariables.map((v) => ({
              name: v.name,
              label: v.label,
              variableType: v.variableType,
              required: v.required,
              sortOrder: v.sortOrder,
              options: v.options?.length ? v.options : Prisma.JsonNull,
            })),
          },
        },
        include: { ratingVariables: { orderBy: { sortOrder: 'asc' } } },
      });
    });

    return serializeActuarial({
      ...actuarial,
      ratingVariables: actuarial.ratingVariables.map((v) => ({
        ...v,
        options: v.options ?? null,
      })),
    });
  }

  async replaceLegal(productId: string, dto: ReplaceLegalDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (!dto.exclusions.length) {
      throw new BadRequestException('Debe existir al menos una exclusión');
    }

    if (dto.exclusions.some((e) => !e.typographyHighlight)) {
      throw new BadRequestException(
        'Todas las exclusiones deben tener typographyHighlight: true (Art. 68).',
      );
    }

    if (
      product.lockedGeneralConditions &&
      dto.documents.some(
        (d) =>
          d.documentType === DocumentType.CONDICIONES_GENERALES &&
          d.isLocked === false,
      )
    ) {
      throw new ForbiddenException(
        'Las condiciones generales están bloqueadas para este producto.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.exclusion.deleteMany({ where: { productId } });
      await tx.legalDocument.deleteMany({ where: { productId } });
      await tx.commercialChannel.deleteMany({ where: { productId } });
      await tx.requiredDocument.deleteMany({ where: { productId } });

      for (const e of dto.exclusions) {
        await tx.exclusion.create({
          data: {
            productId,
            text: e.text,
            sortOrder: e.sortOrder,
            typographyHighlight: e.typographyHighlight,
          },
        });
      }

      for (const d of dto.documents) {
        await tx.legalDocument.create({
          data: {
            productId,
            documentType: d.documentType,
            title: d.title,
            content: d.content,
            isLocked: d.isLocked ?? false,
            isSimplifiedTemplate: d.isSimplifiedTemplate ?? false,
          },
        });
      }

      for (const c of dto.commercialChannels ?? []) {
        await tx.commercialChannel.create({
          data: {
            productId,
            name: c.name,
            channelType:
              (c.channelType as CommercialChannelType) ??
              CommercialChannelType.ALTERNATIVO,
          },
        });
      }

      for (const r of dto.requiredDocuments) {
        await tx.requiredDocument.create({
          data: {
            productId,
            documentKey: r.documentKey,
            label: r.label,
            required: r.required,
            sortOrder: r.sortOrder,
          },
        });
      }
    });

    return this.findOne(productId);
  }

  async getEmissionConfig(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        flowStepConfigs: { orderBy: { sortOrder: 'asc' } },
        formFields: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const flowSteps =
      product.flowStepConfigs.length > 0
        ? product.flowStepConfigs.map((s) => ({
            stepKey: s.stepKey,
            label: s.label,
            shortLabel: s.shortLabel ?? s.label.split(' ').pop(),
            description: s.description,
            enabled: s.enabled,
            formEnabled: s.formEnabled,
            sortOrder: s.sortOrder,
          }))
        : defaultFlowSteps(product.branch);

    const formFields =
      product.formFields.length > 0
        ? product.formFields.map((f) => ({
            id: f.id,
            label: f.label,
            fieldType: f.fieldType,
            required: f.required,
            options: f.options ?? null,
            sortOrder: f.sortOrder,
            stepKey: f.stepKey,
          }))
        : defaultFormFields(product.branch);

    return {
      productId: product.id,
      branch: product.branch,
      flowSteps,
      formFields,
    };
  }

  async replaceEmissionConfig(productId: string, dto: ReplaceEmissionConfigDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.flowStepConfig.deleteMany({ where: { productId } });
      await tx.formField.deleteMany({ where: { productId } });

      for (const step of dto.flowSteps) {
        await tx.flowStepConfig.create({
          data: {
            productId,
            stepKey: step.stepKey,
            label: step.label,
            shortLabel:
              step.shortLabel ?? step.label.split(' ').pop() ?? step.label,
            description: step.description ?? null,
            enabled: step.enabled,
            formEnabled: step.formEnabled,
            sortOrder: step.sortOrder,
          },
        });
      }

      for (const field of dto.formFields) {
        await tx.formField.create({
          data: {
            productId,
            label: field.label,
            fieldType: field.fieldType,
            required: field.required,
            options: field.options?.length ? field.options : Prisma.JsonNull,
            sortOrder: field.sortOrder,
            stepKey: field.stepKey,
          },
        });
      }
    });

    return this.getEmissionConfig(productId);
  }

  async validateSubmission(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        coverages: true,
        exclusions: true,
        actuarialData: true,
        commercialChannels: true,
        legalDocuments: true,
      },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const violations = validateSubmissionGuardrails(product);
    return { valid: violations.length === 0, violations };
  }

  async transition(productId: string, dto: WorkflowTransitionDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: FULL_PRODUCT_INCLUDE,
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const allowed = ALLOWED_TRANSITIONS[product.status] ?? [];
    if (!allowed.includes(dto.toStatus)) {
      throw new BadRequestException(
        `Transición no permitida: ${product.status} → ${dto.toStatus}`,
      );
    }

    if (dto.toStatus === ProductStatus.SUBMITTED_TO_SUDEASEG) {
      const violations = validateSubmissionGuardrails(product);
      if (violations.length) {
        throw new BadRequestException({
          message: 'Guardrails SUDEASEG: no se puede enviar a revisión',
          violations,
        });
      }
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        status: dto.toStatus,
        isImmutable:
          dto.toStatus === ProductStatus.SUBMITTED_TO_SUDEASEG ||
          dto.toStatus === ProductStatus.APPROVED_ACTIVE
            ? true
            : product.isImmutable,
        stateHistory: {
          create: {
            fromStatus: product.status,
            toStatus: dto.toStatus,
            comment: dto.comment ?? null,
          },
        },
      },
      include: FULL_PRODUCT_INCLUDE,
    });

    return this.serializeFullProduct(updated);
  }

  async approve(productId: string, dto: WorkflowApproveDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (product.status !== ProductStatus.SUBMITTED_TO_SUDEASEG) {
      throw new BadRequestException(
        'Solo se puede aprobar desde SUBMITTED_TO_SUDEASEG',
      );
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        status: ProductStatus.APPROVED_ACTIVE,
        isImmutable: true,
        numeroProvidenciaSudeaseg: dto.numeroProvidenciaSudeaseg,
        fechaGacetaAprobacion: new Date(dto.fechaGacetaAprobacion),
        stateHistory: {
          create: {
            fromStatus: product.status,
            toStatus: ProductStatus.APPROVED_ACTIVE,
            comment: `Aprobado — ${dto.numeroProvidenciaSudeaseg}`,
          },
        },
      },
      include: FULL_PRODUCT_INCLUDE,
    });

    return this.serializeFullProduct(updated);
  }

  async getSisip(productId: string) {
    await this.ensureExists(productId);
    return (
      (await this.prisma.sisipConfig.findUnique({ where: { productId } })) ??
      null
    );
  }

  async replaceSisip(productId: string, dto: SisipConfigDto) {
    await this.ensureExists(productId);
    const config = await this.prisma.sisipConfig.upsert({
      where: { productId },
      create: { productId, ...dto },
      update: { ...dto },
    });
    return config;
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.product.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Producto no encontrado');
    }
  }

  private toPlanResponse(plan: {
    name: string;
    description: string | null;
    badge: string | null;
    priceFactor: Prisma.Decimal;
    isRecommended: boolean;
    coverageIds: Prisma.JsonValue;
    coverageLabels: Prisma.JsonValue;
    sortOrder: number;
  }) {
    return {
      name: plan.name,
      description: plan.description,
      badge: plan.badge,
      priceFactor: Number(plan.priceFactor),
      isRecommended: plan.isRecommended,
      coverageIds: plan.coverageIds as string[],
      coverageLabels: plan.coverageLabels as string[],
      sortOrder: plan.sortOrder,
    };
  }

  private serializeListProduct(product: Record<string, unknown>) {
    const p = product as {
      actuarialData: { commercialPremium: Prisma.Decimal; purePremium: Prisma.Decimal } | null;
      coverages: unknown[];
      _count: { exclusions: number; stateHistory: number };
    } & Record<string, unknown>;

    return {
      ...product,
      actuarialData: p.actuarialData
        ? {
            commercialPremium: Number(p.actuarialData.commercialPremium),
            purePremium: Number(p.actuarialData.purePremium),
          }
        : null,
    };
  }

  private serializeFullProduct(product: Record<string, unknown>) {
    const p = product as {
      coverages: Record<string, unknown>[];
      actuarialData: (Record<string, unknown> & {
        ratingVariables: Record<string, unknown>[];
      }) | null;
      productPlans: Record<string, unknown>[];
      stateHistory: { fromStatus: ProductStatus | null; toStatus: ProductStatus; comment: string | null; changedAt: Date }[];
    } & Record<string, unknown>;

    return {
      ...product,
      coverages: p.coverages.map(serializeCoverage),
      actuarialData: p.actuarialData
        ? serializeActuarial({
            ...p.actuarialData,
            ratingVariables: p.actuarialData.ratingVariables.map((v) => ({
              ...v,
              options: v.options ?? null,
            })),
          })
        : null,
      productPlans: p.productPlans.map(serializePlan),
      stateHistory: p.stateHistory.map((h) => ({
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        comment: h.comment,
        changedAt: h.changedAt,
      })),
    };
  }
}
