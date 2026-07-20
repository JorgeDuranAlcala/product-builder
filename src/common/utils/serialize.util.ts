import { Prisma } from '@prisma/client';

export function decimalToNumber(
  value: Prisma.Decimal | number | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

export function serializeCoverage<T extends Record<string, unknown>>(coverage: T) {
  return {
    ...coverage,
    insuredSumMin: decimalToNumber(coverage.insuredSumMin as Prisma.Decimal),
    insuredSumMax: decimalToNumber(coverage.insuredSumMax as Prisma.Decimal),
    insuredSumFixed: decimalToNumber(coverage.insuredSumFixed as Prisma.Decimal),
    deductibleValue: decimalToNumber(coverage.deductibleValue as Prisma.Decimal),
    tariffPremium: decimalToNumber(coverage.tariffPremium as Prisma.Decimal),
  };
}

export function serializeActuarial<T extends Record<string, unknown>>(data: T) {
  return {
    ...data,
    purePremium: decimalToNumber(data.purePremium as Prisma.Decimal),
    administrativeExpenses: decimalToNumber(
      data.administrativeExpenses as Prisma.Decimal,
    ),
    commissions: decimalToNumber(data.commissions as Prisma.Decimal),
    profitMargin: decimalToNumber(data.profitMargin as Prisma.Decimal),
    commercialPremium: decimalToNumber(data.commercialPremium as Prisma.Decimal),
  };
}

export function serializePlan<T extends Record<string, unknown>>(plan: T) {
  return {
    ...plan,
    priceFactor: decimalToNumber(plan.priceFactor as Prisma.Decimal),
  };
}
