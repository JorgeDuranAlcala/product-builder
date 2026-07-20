import { ProductStatus } from '@prisma/client';

export function isProductImmutable(
  isImmutable: boolean,
  status: ProductStatus,
): boolean {
  return (
    isImmutable ||
    status === ProductStatus.SUBMITTED_TO_SUDEASEG ||
    status === ProductStatus.APPROVED_ACTIVE
  );
}

export const IMMUTABLE_FORBIDDEN_MESSAGE =
  'El producto está inmutable: no se pueden modificar tasas, coberturas ni textos en este estado.';

export const ALLOWED_TRANSITIONS: Record<ProductStatus, ProductStatus[]> = {
  [ProductStatus.DRAFT]: [ProductStatus.ACTUARIAL_REVIEW],
  [ProductStatus.ACTUARIAL_REVIEW]: [
    ProductStatus.SUBMITTED_TO_SUDEASEG,
    ProductStatus.DRAFT,
  ],
  [ProductStatus.SUBMITTED_TO_SUDEASEG]: [
    ProductStatus.APPROVED_ACTIVE,
    ProductStatus.REJECTED,
  ],
  [ProductStatus.REJECTED]: [ProductStatus.DRAFT],
  [ProductStatus.APPROVED_ACTIVE]: [],
};
