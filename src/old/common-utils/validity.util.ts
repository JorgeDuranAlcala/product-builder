export function assertValidDateRange(validFrom: Date, validTo: Date): void {
  if (validFrom > validTo) {
    throw new Error('validFrom must be before or equal to validTo');
  }
}

export function isWithinValidity(
  validFrom: Date,
  validTo: Date,
  at: Date = new Date(),
): boolean {
  return at >= validFrom && at <= validTo;
}
