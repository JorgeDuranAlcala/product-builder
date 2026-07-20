export function calculateCommercialPremium(
  purePremium: number,
  administrativeExpenses: number,
  commissions: number,
  profitMargin: number,
): number {
  const loadFactor =
    1 -
    administrativeExpenses / 100 -
    commissions / 100 -
    profitMargin / 100;

  if (loadFactor <= 0) {
    throw new Error('LOAD_FACTOR_INVALID');
  }

  return Number((purePremium / loadFactor).toFixed(2));
}

export function isLoadFactorValid(
  administrativeExpenses: number,
  commissions: number,
  profitMargin: number,
): boolean {
  return administrativeExpenses + commissions + profitMargin < 100;
}
