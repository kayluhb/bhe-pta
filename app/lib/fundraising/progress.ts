import type {FundraisingMilestone} from '~/data/campaigns/types';

export function getProgressPercent(raised: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((raised / goal) * 100));
}

export function getMilestoneStatus(raised: number, milestones: FundraisingMilestone[]) {
  return milestones.map((m) => ({
    id: m.id,
    reached: raised >= m.amount,
  }));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getMilestoneMarkerPercent(amount: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, (amount / goal) * 100);
}
