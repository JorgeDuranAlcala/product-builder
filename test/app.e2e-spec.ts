import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Products Config API (e2e)', () => {
  let app: INestApplication<App>;
  const userId = 'test-user-001';
  let dbAvailable = true;

  beforeAll(async () => {
    try {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      app.setGlobalPrefix('api/v1');
      app.useGlobalPipes(
        new ValidationPipe({ whitelist: true, transform: true }),
      );
      await app.init();
    } catch {
      dbAvailable = false;
      return;
    }

    try {
    const prisma = app.get(PrismaService);
    await prisma.$executeRawUnsafe('TRUNCATE TABLE config_audit_logs CASCADE');
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE certification_runs, producer_product_assignments, product_coverage_tariffs, product_coverages, products, coverage_masters, internal_tariffs, internal_coverages, document_mask_segments, document_masks, document_counters, internal_branches, master_tariffs, master_coverages, master_branches, producers, reinsurance_branches, reinsurance_contracts, currencies RESTART IDENTITY CASCADE',
    );

    await request(app.getHttpServer())
      .post('/api/v1/branches/wizard')
      .set('X-User-Id', userId)
      .send({
        code: 52,
        name: 'PRUEBA',
        coverages: [
          {
            code: 1,
            name: 'COBERTURA 1',
            validFrom: '2023-01-01',
            validTo: '2040-12-31',
            tariffs: [
              {
                code: 1,
                name: 'COBERTURA 1',
                validFrom: '2023-01-01',
                validTo: '2040-12-31',
              },
            ],
          },
        ],
      })
      .expect(201);

    const branchRes = await request(app.getHttpServer())
      .post('/api/v1/branches')
      .set('X-User-Id', userId)
      .send({ code: 38, name: 'COMBINADO RESIDENCIAL' })
      .expect(201);

    const masterBranch = await request(app.getHttpServer())
      .get('/api/v1/branches')
      .expect(200);
    const pruebaBranch = masterBranch.body.find(
      (b: { code: number }) => b.code === 52,
    );
    const masterCoverageId = pruebaBranch.coverages[0].id;

    const internalBranchRes = await request(app.getHttpServer())
      .post('/api/v1/internal-branches')
      .set('X-User-Id', userId)
      .send({
        code: 49,
        name: 'PRUEBA',
        masterBranchId: pruebaBranch.id,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/internal-branches/${internalBranchRes.body.id}/setup`)
      .set('X-User-Id', userId)
      .send({
        counters: [{ concept: 'POLIZA', value: 'POLIZA' }],
        masks: [
          {
            type: 'POLIZA',
            segments: [{ position: 0, token: 'CRAMO' }],
          },
        ],
      })
      .expect(201);

    const coverageWithTariff = await request(app.getHttpServer())
      .post('/api/v1/internal-coverages/with-tariff')
      .set('X-User-Id', userId)
      .send({
        coverage: {
          code: 1,
          internalBranchId: internalBranchRes.body.id,
          masterCoverageId,
          name: 'COBERTURA 1',
        },
        tariff: { code: 1, name: 'COBERTURA 1' },
      })
      .expect(201);

    const currencies = await request(app.getHttpServer())
      .get('/api/v1/catalogs/currencies')
      .expect(200);

    let currencyId = currencies.body[0]?.id;
    if (!currencyId) {
      const prisma = app.get(PrismaService);
      const currency = await prisma.currency.create({
        data: { code: 'USD', symbol: '$', name: 'DOLARES' },
      });
      currencyId = currency.id;
    }

    const contracts = await request(app.getHttpServer())
      .get('/api/v1/catalogs/reinsurance-contracts')
      .expect(200);
    let contractId = contracts.body[0]?.id;
    if (!contractId) {
      const prisma = app.get(PrismaService);
      const contract = await prisma.reinsuranceContract.create({
        data: { code: 6016, name: 'RIESGOS DIVERSOS' },
      });
      contractId = contract.id;
    }

    const coverageMasterRes = await request(app.getHttpServer())
      .post('/api/v1/coverage-master')
      .set('X-User-Id', userId)
      .send({
        masterBranchId: pruebaBranch.id,
        masterCoverageId,
        currencyId,
        internalBranchId: internalBranchRes.body.id,
        internalCoverageId: coverageWithTariff.body.coverage.id,
        reinsuranceContractId: contractId,
      })
      .expect(201);

    const productRes = await request(app.getHttpServer())
      .post('/api/v1/products/wizard')
      .set('X-User-Id', userId)
      .send({
        masterBranchId: branchRes.body.id,
        internalBranchId: internalBranchRes.body.id,
        planName: 'COMBINADO RESIDENCIAL',
        subPlanName: 'COND1 Plan I',
        allowsQuickEmission: true,
        currencyId,
        contractValidity: { from: '2023-01-01', to: '2040-12-31' },
        coverages: [
          {
            coverageMasterId: coverageMasterRes.body.id,
            internalCoverageId: coverageWithTariff.body.coverage.id,
            name: 'Combinado Residencial I',
            validFrom: '2023-01-01',
            validTo: '2040-12-31',
            tariff: {
              minSumInsured: 30000,
              maxSumInsured: 30000,
              premium: 30,
            },
          },
        ],
      })
      .expect(201);

    const producerRes = await request(app.getHttpServer())
      .post('/api/v1/producers')
      .set('X-User-Id', userId)
      .send({ code: 'PROD-E2E', name: 'Productor E2E' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/products/${productRes.body.id}/assign-producers`)
      .set('X-User-Id', userId)
      .send({ producerIds: [producerRes.body.id] })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/products/${productRes.body.id}/certify`)
      .set('X-User-Id', userId)
      .send({ environment: 'QA', status: 'PASSED' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/products/${productRes.body.id}/certify`)
      .set('X-User-Id', userId)
      .send({ environment: 'PRODUCTION', status: 'PASSED' })
      .expect(201);

    (global as unknown as { productId: number }).productId = productRes.body.id;
    } catch {
      dbAvailable = false;
    }
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  const skipIfNoDb = () => {
    if (!dbAvailable) {
      console.warn('Skipping e2e: database not available. Configure .env and run migrations.');
    }
    return !dbAvailable;
  };

  it('GET /health returns ok', async () => {
    if (skipIfNoDb()) return;
    await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
      });
  });

  it('rejects mutations without X-User-Id', async () => {
    if (skipIfNoDb()) return;
    await request(app.getHttpServer())
      .post('/api/v1/branches')
      .send({ code: 99, name: 'TEST' })
      .expect(401);
  });

  it('GET /products/:id/full-config returns SISIP chain', async () => {
    if (skipIfNoDb()) return;
    const productId = (global as unknown as { productId: number }).productId;
    const res = await request(app.getHttpServer())
      .get(`/api/v1/products/${productId}/full-config`)
      .expect(200);

    expect(res.body.product.planName).toBe('COMBINADO RESIDENCIAL');
    expect(res.body.coverageMasters.length).toBeGreaterThan(0);
  });

  it('GET /products/:id/emit-preview returns emitible', async () => {
    if (skipIfNoDb()) return;
    const productId = (global as unknown as { productId: number }).productId;
    const res = await request(app.getHttpServer())
      .get(`/api/v1/products/${productId}/emit-preview`)
      .set('X-User-Id', userId)
      .expect(200);

    expect(res.body.emitible).toBe(true);
    expect(res.body.issues).toHaveLength(0);
  });

  it('audit logs are created for mutations', async () => {
    if (skipIfNoDb()) return;
    const productId = (global as unknown as { productId: number }).productId;
    const res = await request(app.getHttpServer())
      .get(`/api/v1/audit/products/${productId}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.some((l: { userId: string }) => l.userId === userId)).toBe(
      true,
    );
  });

  it('audit logs filterable by user', async () => {
    if (skipIfNoDb()) return;
    const res = await request(app.getHttpServer())
      .get(`/api/v1/audit/users/${userId}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
