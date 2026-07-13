-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('VIGENTE', 'INACTIVO');
CREATE TYPE "TreatmentType" AS ENUM ('EXTR_SUMA_PRIMA');
CREATE TYPE "AppliesWhen" AS ENUM ('PRIMERA_PRIMA');
CREATE TYPE "SumRule" AS ENUM ('MAYOR_QUE', 'MENOR_QUE', 'IGUAL');
CREATE TYPE "ProducerType" AS ENUM ('PRODUCTOR', 'CODIGO_DIRECTO', 'TODOS');
CREATE TYPE "AssignmentScope" AS ENUM ('PRODUCTOR', 'CODIGO_DIRECTO', 'TODOS');
CREATE TYPE "CertificationEnvironment" AS ENUM ('QA', 'PRODUCTION');
CREATE TYPE "CertificationStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED');
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'WIZARD_CREATE', 'ASSIGN_PRODUCER', 'CERTIFY', 'EMIT_PREVIEW');
CREATE TYPE "DocumentMaskType" AS ENUM ('POLIZA', 'RECIBO', 'SINIESTRO', 'CESION_FACUL', 'CESION_COAS');

-- CreateTable
CREATE TABLE "Currency" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Currency_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReinsuranceContract" (
    "id" SERIAL NOT NULL,
    "code" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReinsuranceContract_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReinsuranceBranch" (
    "id" SERIAL NOT NULL,
    "code" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReinsuranceBranch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MasterBranch" (
    "id" SERIAL NOT NULL,
    "code" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "alias1" TEXT,
    "alias2" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'VIGENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    CONSTRAINT "MasterBranch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MasterCoverage" (
    "id" SERIAL NOT NULL,
    "masterBranchId" INTEGER NOT NULL,
    "code" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'VIGENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    CONSTRAINT "MasterCoverage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MasterTariff" (
    "id" SERIAL NOT NULL,
    "masterCoverageId" INTEGER NOT NULL,
    "code" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'VIGENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    CONSTRAINT "MasterTariff_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InternalBranch" (
    "id" SERIAL NOT NULL,
    "code" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "masterBranchId" INTEGER NOT NULL,
    "group" TEXT,
    "imageHandling" BOOLEAN NOT NULL DEFAULT false,
    "status" "RecordStatus" NOT NULL DEFAULT 'VIGENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    CONSTRAINT "InternalBranch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentCounter" (
    "id" SERIAL NOT NULL,
    "internalBranchId" INTEGER NOT NULL,
    "concept" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    CONSTRAINT "DocumentCounter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentMask" (
    "id" SERIAL NOT NULL,
    "internalBranchId" INTEGER NOT NULL,
    "type" "DocumentMaskType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    CONSTRAINT "DocumentMask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentMaskSegment" (
    "id" SERIAL NOT NULL,
    "maskId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "useSeparator" BOOLEAN NOT NULL DEFAULT true,
    "separator" TEXT NOT NULL DEFAULT '-',
    CONSTRAINT "DocumentMaskSegment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InternalCoverage" (
    "id" SERIAL NOT NULL,
    "code" INTEGER NOT NULL,
    "internalBranchId" INTEGER NOT NULL,
    "masterCoverageId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "coverageGroup" TEXT,
    "sumInsuredRequiredAtLevel" BOOLEAN NOT NULL DEFAULT false,
    "treatmentType" "TreatmentType" NOT NULL DEFAULT 'EXTR_SUMA_PRIMA',
    "appliesWhen" "AppliesWhen" NOT NULL DEFAULT 'PRIMERA_PRIMA',
    "calculationForm" TEXT NOT NULL DEFAULT 'SOBPECER',
    "sumForm" TEXT NOT NULL DEFAULT 'SOBPECER',
    "status" "RecordStatus" NOT NULL DEFAULT 'VIGENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    CONSTRAINT "InternalCoverage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InternalTariff" (
    "id" SERIAL NOT NULL,
    "code" INTEGER NOT NULL,
    "internalCoverageId" INTEGER NOT NULL,
    "masterTariffId" INTEGER,
    "name" TEXT NOT NULL,
    "tariffGroup" TEXT,
    "treatmentType" "TreatmentType" NOT NULL DEFAULT 'EXTR_SUMA_PRIMA',
    "appliesWhen" "AppliesWhen" NOT NULL DEFAULT 'PRIMERA_PRIMA',
    "calculationForm" TEXT NOT NULL DEFAULT 'SOBPECER',
    "sumForm" TEXT NOT NULL DEFAULT 'SOBPECER',
    "status" "RecordStatus" NOT NULL DEFAULT 'VIGENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    CONSTRAINT "InternalTariff_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CoverageMaster" (
    "id" SERIAL NOT NULL,
    "masterBranchId" INTEGER NOT NULL,
    "masterCoverageId" INTEGER NOT NULL,
    "dependsOnCoverageId" INTEGER,
    "compareToCoverageId" INTEGER,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "currencyId" INTEGER NOT NULL,
    "reinsuranceContractId" INTEGER,
    "reinsuranceBranchId" INTEGER,
    "pcndBranchCode" INTEGER,
    "pcndCoverageCode" INTEGER,
    "status" "RecordStatus" NOT NULL DEFAULT 'VIGENTE',
    "reinsuranceSumRule" "SumRule" NOT NULL DEFAULT 'MAYOR_QUE',
    "receiptSumRule" "SumRule" NOT NULL DEFAULT 'MAYOR_QUE',
    "calculationRoutine" BOOLEAN NOT NULL DEFAULT true,
    "inputProc" BOOLEAN NOT NULL DEFAULT false,
    "outputProc" BOOLEAN NOT NULL DEFAULT false,
    "internalBranchId" INTEGER NOT NULL,
    "internalCoverageId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    CONSTRAINT "CoverageMaster_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "masterBranchId" INTEGER NOT NULL,
    "internalBranchId" INTEGER NOT NULL,
    "planName" TEXT NOT NULL,
    "subPlanName" TEXT,
    "allowsQuickEmission" BOOLEAN NOT NULL DEFAULT false,
    "currencyId" INTEGER NOT NULL,
    "contractValidFrom" TIMESTAMP(3) NOT NULL,
    "contractValidTo" TIMESTAMP(3) NOT NULL,
    "annualCloseMonth" INTEGER NOT NULL DEFAULT 12,
    "premiumGuaranteeDays" INTEGER NOT NULL DEFAULT 30,
    "renewalFrequency" TEXT NOT NULL DEFAULT 'ANUAL',
    "renewalType" TEXT NOT NULL DEFAULT 'NORMAL',
    "emissionType" TEXT NOT NULL DEFAULT 'PRORRATA',
    "premiumDueFrequency" TEXT NOT NULL DEFAULT 'ANUAL',
    "premiumDueType" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" "RecordStatus" NOT NULL DEFAULT 'VIGENTE',
    "legacyCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductCoverage" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "internalCoverageId" INTEGER NOT NULL,
    "masterCoverageId" INTEGER,
    "coverageMasterId" INTEGER,
    "name" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    CONSTRAINT "ProductCoverage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductCoverageTariff" (
    "id" SERIAL NOT NULL,
    "productCoverageId" INTEGER NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "minSumInsured" DECIMAL(18,2) NOT NULL,
    "maxSumInsured" DECIMAL(18,2) NOT NULL,
    "premium" DECIMAL(18,2) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'VIGENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    CONSTRAINT "ProductCoverageTariff_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Producer" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProducerType" NOT NULL DEFAULT 'PRODUCTOR',
    "legacyCode" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'VIGENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    CONSTRAINT "Producer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProducerProductAssignment" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "producerId" INTEGER,
    "scope" "AssignmentScope" NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'VIGENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    CONSTRAINT "ProducerProductAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CertificationRun" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "environment" "CertificationEnvironment" NOT NULL,
    "status" "CertificationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "certifiedBy" TEXT,
    "certifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    CONSTRAINT "CertificationRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "config_audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "productId" INTEGER,
    "summary" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "config_audit_logs_pkey" PRIMARY KEY ("id")
);

-- Unique indexes
CREATE UNIQUE INDEX "Currency_code_key" ON "Currency"("code");
CREATE UNIQUE INDEX "ReinsuranceContract_code_key" ON "ReinsuranceContract"("code");
CREATE UNIQUE INDEX "ReinsuranceBranch_code_key" ON "ReinsuranceBranch"("code");
CREATE UNIQUE INDEX "MasterBranch_code_key" ON "MasterBranch"("code");
CREATE UNIQUE INDEX "MasterCoverage_masterBranchId_code_key" ON "MasterCoverage"("masterBranchId", "code");
CREATE UNIQUE INDEX "MasterTariff_masterCoverageId_code_key" ON "MasterTariff"("masterCoverageId", "code");
CREATE UNIQUE INDEX "InternalBranch_masterBranchId_code_key" ON "InternalBranch"("masterBranchId", "code");
CREATE UNIQUE INDEX "DocumentCounter_internalBranchId_concept_key" ON "DocumentCounter"("internalBranchId", "concept");
CREATE UNIQUE INDEX "DocumentMask_internalBranchId_type_key" ON "DocumentMask"("internalBranchId", "type");
CREATE UNIQUE INDEX "DocumentMaskSegment_maskId_position_key" ON "DocumentMaskSegment"("maskId", "position");
CREATE UNIQUE INDEX "InternalCoverage_internalBranchId_code_key" ON "InternalCoverage"("internalBranchId", "code");
CREATE UNIQUE INDEX "InternalTariff_internalCoverageId_code_key" ON "InternalTariff"("internalCoverageId", "code");
CREATE UNIQUE INDEX "CoverageMaster_masterBranchId_masterCoverageId_key" ON "CoverageMaster"("masterBranchId", "masterCoverageId");
CREATE UNIQUE INDEX "Producer_code_key" ON "Producer"("code");
CREATE UNIQUE INDEX "CertificationRun_productId_environment_key" ON "CertificationRun"("productId", "environment");
CREATE INDEX "config_audit_logs_userId_idx" ON "config_audit_logs"("userId");
CREATE INDEX "config_audit_logs_entityType_entityId_idx" ON "config_audit_logs"("entityType", "entityId");
CREATE INDEX "config_audit_logs_productId_idx" ON "config_audit_logs"("productId");
CREATE INDEX "config_audit_logs_createdAt_idx" ON "config_audit_logs"("createdAt");

-- Foreign keys
ALTER TABLE "MasterCoverage" ADD CONSTRAINT "MasterCoverage_masterBranchId_fkey" FOREIGN KEY ("masterBranchId") REFERENCES "MasterBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MasterTariff" ADD CONSTRAINT "MasterTariff_masterCoverageId_fkey" FOREIGN KEY ("masterCoverageId") REFERENCES "MasterCoverage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InternalBranch" ADD CONSTRAINT "InternalBranch_masterBranchId_fkey" FOREIGN KEY ("masterBranchId") REFERENCES "MasterBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentCounter" ADD CONSTRAINT "DocumentCounter_internalBranchId_fkey" FOREIGN KEY ("internalBranchId") REFERENCES "InternalBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentMask" ADD CONSTRAINT "DocumentMask_internalBranchId_fkey" FOREIGN KEY ("internalBranchId") REFERENCES "InternalBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentMaskSegment" ADD CONSTRAINT "DocumentMaskSegment_maskId_fkey" FOREIGN KEY ("maskId") REFERENCES "DocumentMask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InternalCoverage" ADD CONSTRAINT "InternalCoverage_internalBranchId_fkey" FOREIGN KEY ("internalBranchId") REFERENCES "InternalBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InternalCoverage" ADD CONSTRAINT "InternalCoverage_masterCoverageId_fkey" FOREIGN KEY ("masterCoverageId") REFERENCES "MasterCoverage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InternalTariff" ADD CONSTRAINT "InternalTariff_internalCoverageId_fkey" FOREIGN KEY ("internalCoverageId") REFERENCES "InternalCoverage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InternalTariff" ADD CONSTRAINT "InternalTariff_masterTariffId_fkey" FOREIGN KEY ("masterTariffId") REFERENCES "MasterTariff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CoverageMaster" ADD CONSTRAINT "CoverageMaster_masterBranchId_fkey" FOREIGN KEY ("masterBranchId") REFERENCES "MasterBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CoverageMaster" ADD CONSTRAINT "CoverageMaster_masterCoverageId_fkey" FOREIGN KEY ("masterCoverageId") REFERENCES "MasterCoverage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CoverageMaster" ADD CONSTRAINT "CoverageMaster_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CoverageMaster" ADD CONSTRAINT "CoverageMaster_reinsuranceContractId_fkey" FOREIGN KEY ("reinsuranceContractId") REFERENCES "ReinsuranceContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CoverageMaster" ADD CONSTRAINT "CoverageMaster_reinsuranceBranchId_fkey" FOREIGN KEY ("reinsuranceBranchId") REFERENCES "ReinsuranceBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CoverageMaster" ADD CONSTRAINT "CoverageMaster_internalBranchId_fkey" FOREIGN KEY ("internalBranchId") REFERENCES "InternalBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CoverageMaster" ADD CONSTRAINT "CoverageMaster_internalCoverageId_fkey" FOREIGN KEY ("internalCoverageId") REFERENCES "InternalCoverage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_masterBranchId_fkey" FOREIGN KEY ("masterBranchId") REFERENCES "MasterBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_internalBranchId_fkey" FOREIGN KEY ("internalBranchId") REFERENCES "InternalBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductCoverage" ADD CONSTRAINT "ProductCoverage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductCoverage" ADD CONSTRAINT "ProductCoverage_internalCoverageId_fkey" FOREIGN KEY ("internalCoverageId") REFERENCES "InternalCoverage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductCoverage" ADD CONSTRAINT "ProductCoverage_masterCoverageId_fkey" FOREIGN KEY ("masterCoverageId") REFERENCES "MasterCoverage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductCoverage" ADD CONSTRAINT "ProductCoverage_coverageMasterId_fkey" FOREIGN KEY ("coverageMasterId") REFERENCES "CoverageMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductCoverageTariff" ADD CONSTRAINT "ProductCoverageTariff_productCoverageId_fkey" FOREIGN KEY ("productCoverageId") REFERENCES "ProductCoverage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProducerProductAssignment" ADD CONSTRAINT "ProducerProductAssignment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProducerProductAssignment" ADD CONSTRAINT "ProducerProductAssignment_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "Producer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CertificationRun" ADD CONSTRAINT "CertificationRun_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
