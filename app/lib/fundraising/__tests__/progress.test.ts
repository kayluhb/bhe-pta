import {describe, expect, it} from 'vitest';

import type {FundraisingMilestone} from '~/data/campaigns/types';
import {formatCurrency, getMilestoneStatus, getProgressPercent} from '~/lib/fundraising/progress';

const milestones: FundraisingMilestone[] = [
  {id: 'a', label: 'A', description: '', amount: 20_000},
  {id: 'b', label: 'B', description: '', amount: 50_000},
  {id: 'c', label: 'C', description: '', amount: 85_000},
];

describe('getProgressPercent', () => {
  it('returns 0 when goal is 0', () => {
    expect(getProgressPercent(100, 0)).toBe(0);
  });

  it('caps at 100 when raised exceeds goal', () => {
    expect(getProgressPercent(90_000, 85_000)).toBe(100);
  });

  it('rounds to nearest integer percent', () => {
    expect(getProgressPercent(42_500, 85_000)).toBe(50);
  });
});

describe('getMilestoneStatus', () => {
  it('marks milestones reached when raised meets threshold', () => {
    const status = getMilestoneStatus(25_000, milestones);
    expect(status).toEqual([
      {id: 'a', reached: true},
      {id: 'b', reached: false},
      {id: 'c', reached: false},
    ]);
  });
});

describe('formatCurrency', () => {
  it('formats whole dollars without cents', () => {
    expect(formatCurrency(85_000)).toBe('$85,000');
  });
});
