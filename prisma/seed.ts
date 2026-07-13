import {
  AppliesWhen,
  DocumentMaskType,
  PrismaClient,
  RecordStatus,
  TreatmentType,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const currency = await prisma.currency.upsert({
    where: { code: 'USD' },
    update: {},
    create: { code: 'USD', symbol: '$', name: 'DOLARES' },
  });

  const reinsuranceContract = await prisma.reinsuranceContract.upsert({
    where: { code: 6016 },
    update: {},
    create: { code: 6016, name: 'RIESGOS DIVERSOS' },
  });

  const reinsuranceBranch = await prisma.reinsuranceBranch.upsert({
    where: { code: 108 },
    update: {},
    create: { code: 108, name: 'RIESGOS DIVERSOS' },
  });

  // Paso 1: Ramos catálogo
  const branchAutomovil = await prisma.masterBranch.upsert({
    where: { code: 18 },
    update: {},
    create: {
      code: 18,
      name: 'AUTOMOVIL',
      alias1: 'AUTO',
      status: RecordStatus.VIGENTE,
      createdBy: 'seed',
    },
  });

  const branchPrueba = await prisma.masterBranch.upsert({
    where: { code: 52 },
    update: {},
    create: {
      code: 52,
      name: 'PRUEBA',
      status: RecordStatus.VIGENTE,
      createdBy: 'seed',
      coverages: {
        create: {
          code: 1,
          name: 'COBERTURA 1',
          validFrom: new Date('2023-01-01'),
          validTo: new Date('2040-12-31'),
          status: RecordStatus.VIGENTE,
          createdBy: 'seed',
          tariffs: {
            create: {
              code: 1,
              name: 'COBERTURA 1',
              validFrom: new Date('2023-01-01'),
              validTo: new Date('2040-12-31'),
              status: RecordStatus.VIGENTE,
              createdBy: 'seed',
            },
          },
        },
      },
    },
    include: { coverages: { include: { tariffs: true } } },
  });

  const branchComercial = await prisma.masterBranch.upsert({
    where: { code: 38 },
    update: {},
    create: {
      code: 38,
      name: 'COMBINADO RESIDENCIAL',
      status: RecordStatus.VIGENTE,
      createdBy: 'seed',
    },
  });

  const masterCoverage = branchPrueba.coverages[0];
  const masterTariff = masterCoverage.tariffs[0];

  // Paso 2: Ramo Interno
  const internalBranch = await prisma.internalBranch.upsert({
    where: {
      masterBranchId_code: { masterBranchId: branchPrueba.id, code: 49 },
    },
    update: {},
    create: {
      code: 49,
      name: 'PRUEBA',
      masterBranchId: branchPrueba.id,
      imageHandling: false,
      status: RecordStatus.VIGENTE,
      createdBy: 'seed',
      counters: {
        create: [
          { concept: 'COTIZACION', value: 'COTIZACION', createdBy: 'seed' },
          { concept: 'POLIZA', value: 'POLIZA', createdBy: 'seed' },
          { concept: 'RECIBO', value: 'RECIBO', createdBy: 'seed' },
          { concept: 'SINIESTRO', value: 'SINIESTRO', createdBy: 'seed' },
        ],
      },
      masks: {
        create: [
          {
            type: DocumentMaskType.POLIZA,
            createdBy: 'seed',
            segments: {
              create: [
                { position: 0, token: 'CRAMO', useSeparator: true, separator: '-' },
                { position: 1, token: 'CSUCUR', useSeparator: true, separator: '-' },
                { position: 2, token: 'XCONTPOL', useSeparator: true, separator: '-' },
              ],
            },
          },
        ],
      },
    },
  });

  // Paso 3+4: Cobertura y Tarifa Interna
  const internalCoverage = await prisma.internalCoverage.upsert({
    where: {
      internalBranchId_code: { internalBranchId: internalBranch.id, code: 1 },
    },
    update: {},
    create: {
      code: 1,
      internalBranchId: internalBranch.id,
      masterCoverageId: masterCoverage.id,
      name: 'COBERTURA 1',
      sumInsuredRequiredAtLevel: false,
      treatmentType: TreatmentType.EXTR_SUMA_PRIMA,
      appliesWhen: AppliesWhen.PRIMERA_PRIMA,
      calculationForm: 'SOBPECER',
      sumForm: 'SOBPECER',
      createdBy: 'seed',
      tariffs: {
        create: {
          code: 1,
          masterTariffId: masterTariff.id,
          name: 'COBERTURA 1',
          treatmentType: TreatmentType.EXTR_SUMA_PRIMA,
          appliesWhen: AppliesWhen.PRIMERA_PRIMA,
          calculationForm: 'SOBPECER',
          sumForm: 'SOBPECER',
          createdBy: 'seed',
        },
      },
    },
    include: { tariffs: true },
  });

  // Paso 5: Maestro reaseguro
  const coverageMaster = await prisma.coverageMaster.upsert({
    where: {
      masterBranchId_masterCoverageId: {
        masterBranchId: branchPrueba.id,
        masterCoverageId: masterCoverage.id,
      },
    },
    update: {},
    create: {
      masterBranchId: branchPrueba.id,
      masterCoverageId: masterCoverage.id,
      currencyId: currency.id,
      reinsuranceContractId: reinsuranceContract.id,
      reinsuranceBranchId: reinsuranceBranch.id,
      internalBranchId: internalBranch.id,
      internalCoverageId: internalCoverage.id,
      mandatory: false,
      calculationRoutine: true,
      createdBy: 'seed',
    },
  });

  // Paso 6: Plan
  let product = await prisma.product.findFirst({
    where: { planName: 'COMBINADO RESIDENCIAL' },
  });

  if (!product) {
    product = await prisma.product.create({
      data: {
        masterBranchId: branchComercial.id,
        internalBranchId: internalBranch.id,
        planName: 'COMBINADO RESIDENCIAL',
        subPlanName: 'COND1 Plan I',
        allowsQuickEmission: true,
        currencyId: currency.id,
        contractValidFrom: new Date('2023-01-01'),
        contractValidTo: new Date('2040-12-31'),
        annualCloseMonth: 12,
        premiumGuaranteeDays: 30,
        renewalFrequency: 'ANUAL',
        renewalType: 'NORMAL',
        emissionType: 'PRORRATA',
        premiumDueFrequency: 'ANUAL',
        premiumDueType: 'NORMAL',
        status: RecordStatus.VIGENTE,
        createdBy: 'seed',
        coverages: {
          create: [
            {
              internalCoverageId: internalCoverage.id,
              coverageMasterId: coverageMaster.id,
              masterCoverageId: masterCoverage.id,
              name: 'Combinado Residencial I',
              validFrom: new Date('2023-01-01'),
              validTo: new Date('2040-12-31'),
              createdBy: 'seed',
              tariffs: {
                create: {
                  validFrom: new Date('2023-01-01'),
                  validTo: new Date('2040-12-31'),
                  minSumInsured: 30000,
                  maxSumInsured: 30000,
                  premium: 30,
                  createdBy: 'seed',
                },
              },
            },
            {
              internalCoverageId: internalCoverage.id,
              coverageMasterId: coverageMaster.id,
              name: 'Motín, Disturbios Populares',
              validFrom: new Date('2023-01-01'),
              validTo: new Date('2040-12-31'),
              createdBy: 'seed',
              tariffs: {
                create: {
                  validFrom: new Date('2023-01-01'),
                  validTo: new Date('2040-12-31'),
                  minSumInsured: 30000,
                  maxSumInsured: 30000,
                  premium: 30,
                  createdBy: 'seed',
                },
              },
            },
            {
              internalCoverageId: internalCoverage.id,
              coverageMasterId: coverageMaster.id,
              name: 'Responsabilidad Civil General',
              validFrom: new Date('2023-01-01'),
              validTo: new Date('2040-12-31'),
              createdBy: 'seed',
              tariffs: {
                create: {
                  validFrom: new Date('2023-01-01'),
                  validTo: new Date('2040-12-31'),
                  minSumInsured: 30000,
                  maxSumInsured: 30000,
                  premium: 30,
                  createdBy: 'seed',
                },
              },
            },
          ],
        },
      },
    });
  }

  const producer = await prisma.producer.upsert({
    where: { code: 'PROD001' },
    update: {},
    create: {
      code: 'PROD001',
      name: 'Productor Demo',
      createdBy: 'seed',
    },
  });

  await prisma.producerProductAssignment.deleteMany({
    where: { productId: product.id },
  });
  await prisma.producerProductAssignment.create({
    data: {
      productId: product.id,
      producerId: producer.id,
      scope: 'PRODUCTOR',
      validFrom: new Date('2023-01-01'),
      createdBy: 'seed',
    },
  });

  await prisma.certificationRun.upsert({
    where: {
      productId_environment: { productId: product.id, environment: 'QA' },
    },
    update: { status: 'PASSED', certifiedBy: 'seed', certifiedAt: new Date() },
    create: {
      productId: product.id,
      environment: 'QA',
      status: 'PASSED',
      certifiedBy: 'seed',
      certifiedAt: new Date(),
      createdBy: 'seed',
    },
  });

  await prisma.certificationRun.upsert({
    where: {
      productId_environment: { productId: product.id, environment: 'PRODUCTION' },
    },
    update: { status: 'PASSED', certifiedBy: 'seed', certifiedAt: new Date() },
    create: {
      productId: product.id,
      environment: 'PRODUCTION',
      status: 'PASSED',
      certifiedBy: 'seed',
      certifiedAt: new Date(),
      createdBy: 'seed',
    },
  });

  console.log('Seed completed:', {
    branches: [branchAutomovil.code, branchPrueba.code, branchComercial.code],
    productId: product.id,
    producerId: producer.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
