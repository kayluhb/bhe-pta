import type {FundraisingMilestone} from '~/data/annual-fund-campaign';

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
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(amount);
}

export function formatTargetDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

export function getMilestoneMarkerPercent(amount: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, (amount / goal) * 100);
}
