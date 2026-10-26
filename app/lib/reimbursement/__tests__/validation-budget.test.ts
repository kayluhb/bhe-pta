import {describe, expect, it} from 'vitest';

import {isBudgetAccount} from '../validation';

describe('isBudgetAccount', () => {
  it('accepts Nick Akery scholarship', () => {
    expect(isBudgetAccount('Nick Akery scholarship')).toBe(true);
  });

  it('accepts Field trips', () => {
    expect(isBudgetAccount('Field trips')).toBe(true);
  });

  it('rejects unknown or empty values', () => {
    expect(isBudgetAccount('')).toBe(false);
    expect(isBudgetAccount('Nick Akery')).toBe(false);
    expect(isBudgetAccount('not-a-budget-line')).toBe(false);
  });
});
