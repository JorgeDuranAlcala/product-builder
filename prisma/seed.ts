import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import {
  ContractCurrency,
  EmissionType,
  PrismaClient,
  ProductBranch,
  ProductStatus,
  UserRole,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@local.test' },
    update: {},
    create: {
      email: 'admin@local.test',
      passwordHash: adminPassword,
      fullName: 'Administrador',
      role: UserRole.ADMIN,
    },
  });

  const demo = await prisma.product.upsert({
    where: { internalCode: 'RCV-DEMO-001' },
    update: {},
    create: {
      commercialName: 'RCV Obligatorio Demo',
      internalCode: 'RCV-DEMO-001',
      branch: ProductBranch.RCV_OBLIGATORIO,
      currency: ContractCurrency.VES,
      emissionType: EmissionType.EMISION_GARANTIZADA,
      status: ProductStatus.DRAFT,
      simplifiedContract: true,
      uniformConditions: true,
      lockedGeneralConditions: true,
      isImmutable: false,
      allowsQuickEmission: false,
      stateHistory: {
        create: {
          toStatus: ProductStatus.DRAFT,
          comment: 'Producto demo creado',
        },
      },
      coverages: {
        create: {
          name: 'Daños a Terceros',
          sortOrder: 0,
          isBasicMandatory: true,
          insuredSumFixed: 50000,
          waitingPeriodDays: 0,
        },
      },
      exclusions: {
        create: {
          text: 'SE EXCLUYEN DAÑOS CAUSADOS POR ACTOS INTENCIONALES DEL ASEGURADO.',
          sortOrder: 0,
          typographyHighlight: true,
        },
      },
    },
    include: { coverages: true },
  });

  console.log('Seed completed:', {
    admin: 'admin@local.test / admin123',
    demoProduct: demo.internalCode,
    demoProductId: demo.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
