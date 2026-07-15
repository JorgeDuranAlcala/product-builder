import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { BranchesModule } from './branches/branches.module';
import { CatalogsModule } from './catalogs/catalogs.module';
import { CoverageMasterModule } from './coverage-master/coverage-master.module';
import { JwtAuthGuard, RolesGuard } from './common/guards/jwt-auth.guard';
import { HealthModule } from './health/health.module';
import { InternalBranchesModule } from './internal-branches/internal-branches.module';
import { InternalCoveragesModule } from './internal-coverages/internal-coverages.module';
import { InternalTariffsModule } from './internal-tariffs/internal-tariffs.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProducersModule } from './producers/producers.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AuditModule,
    HealthModule,
    CatalogsModule,
    BranchesModule,
    InternalBranchesModule,
    InternalCoveragesModule,
    InternalTariffsModule,
    CoverageMasterModule,
    ProductsModule,
    ProducersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
