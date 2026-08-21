import {describe, expect, it} from 'vitest';

import type {FundraisingMilestone} from '~/data/annual-fund-campaign';
import {formatCurrency, formatTargetDate, getMilestoneStatus, getProgressPercent} from '~/lib/fundraising/progress';

const milestones: FundraisingMilestone[] = [
  {id: 'a', label: 'A', description: '', amount: 85_000, targetDate: '2026-06-25'},
  {id: 'b', label: 'B', description: '', amount: 187_000, targetDate: '2026-11-01'},
];

describe('getProgressPercent', () => {
  it('returns 0 when goal is 0', () => {
    expect(getProgressPercent(100, 0)).toBe(0);
  });

  it('caps at 100 when raised exceeds goal', () => {
    expect(getProgressPercent(200_000, 187_000)).toBe(100);
  });

  it('rounds to nearest integer percent', () => {
    expect(getProgressPercent(93_500, 187_000)).toBe(50);
  });
});

describe('getMilestoneStatus', () => {
  it('marks milestones reached when raised meets threshold', () => {
    const status = getMilestoneStatus(90_000, milestones);
    expect(status).toEqual([
      {id: 'a', reached: true},
      {id: 'b', reached: false},
    ]);
  });
});

describe('formatCurrency', () => {
  it('formats whole dollars without cents', () => {
    expect(formatCurrency(187_000)).toBe('$187,000');
  });
});

describe('formatTargetDate', () => {
  it('formats ISO dates for display', () => {
    expect(formatTargetDate('2026-06-25')).toBe('Jun 25');
    expect(formatTargetDate('2026-11-01')).toBe('Nov 1');
  });
});
