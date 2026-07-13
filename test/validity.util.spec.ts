import { assertValidDateRange, isWithinValidity } from '../src/common/utils/validity.util';

describe('validity.util', () => {
  it('assertValidDateRange passes for valid range', () => {
    expect(() =>
      assertValidDateRange(new Date('2023-01-01'), new Date('2040-12-31')),
    ).not.toThrow();
  });

  it('assertValidDateRange throws for invalid range', () => {
    expect(() =>
      assertValidDateRange(new Date('2040-01-01'), new Date('2023-01-01')),
    ).toThrow();
  });

  it('isWithinValidity returns true inside range', () => {
    const result = isWithinValidity(
      new Date('2023-01-01'),
      new Date('2040-12-31'),
      new Date('2025-06-01'),
    );
    expect(result).toBe(true);
  });

  it('isWithinValidity returns false outside range', () => {
    const result = isWithinValidity(
      new Date('2023-01-01'),
      new Date('2040-12-31'),
      new Date('2050-01-01'),
    );
    expect(result).toBe(false);
  });
});
