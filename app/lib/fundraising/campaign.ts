import {
  type AnnualFundCampaign,
  annualFundCampaign,
  annualFundCodeDefaults,
  annualFundGiveUrl,
  type FundraisingMilestone,
} from '~/data/annual-fund-campaign';

export interface AnnualFundDraft {
  goalAmount: number;
  lastUpdated: string;
  milestones: FundraisingMilestone[];
  offlineRaisedAmount: number;
  onlineRaisedAmount: number;
  schoolYear: string;
  suggestedAskPerChild: number;
  thermometerVisible: boolean;
  title: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MILESTONE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isRealIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function annualFundAsOfDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Chicago'}).format(now);
}

export function draftFromCode(): AnnualFundDraft {
  return {
    goalAmount: annualFundCodeDefaults.goalAmount,
    lastUpdated: annualFundCodeDefaults.lastUpdated,
    milestones: annualFundCodeDefaults.milestones.map((milestone) => ({...milestone})),
    offlineRaisedAmount: annualFundCodeDefaults.offlineRaisedAmount,
    onlineRaisedAmount: annualFundCodeDefaults.onlineRaisedAmount,
    schoolYear: annualFundCodeDefaults.schoolYear,
    suggestedAskPerChild: annualFundCodeDefaults.suggestedAskPerChild,
    thermometerVisible: annualFundCodeDefaults.thermometerVisible,
    title: annualFundCodeDefaults.title,
  };
}

export function campaignFromDraft(draft: AnnualFundDraft): AnnualFundCampaign {
  return {
    giveUrl: annualFundGiveUrl,
    goalAmount: draft.goalAmount,
    lastUpdated: draft.lastUpdated,
    milestones: draft.milestones,
    raisedAmount: roundMoney(draft.onlineRaisedAmount + draft.offlineRaisedAmount),
    schoolYear: draft.schoolYear,
    suggestedAskPerChild: draft.suggestedAskPerChild,
    thermometerVisible: draft.thermometerVisible,
    title: draft.title,
  };
}

export function codeCampaign(): AnnualFundCampaign {
  return annualFundCampaign;
}

/** Dollar amount with optional cents. Accepts commas and a leading $. */
export function parseMoney(raw: unknown): number | null {
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || raw < 0) return null;
    return roundMoney(raw);
  }
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim().replace(/[$,_\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return roundMoney(Number(cleaned));
}

export function parseWholeDollars(raw: unknown): number | null {
  if (typeof raw === 'number') {
    if (!Number.isInteger(raw) || raw <= 0) return null;
    return raw;
  }
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim().replace(/[$,_\s]/g, '');
  if (!/^\d+$/.test(cleaned)) return null;
  const amount = Number(cleaned);
  if (amount <= 0) return null;
  return amount;
}

export function validateAnnualFundDraft(draft: AnnualFundDraft): string | null {
  if (!draft.title.trim()) return 'Title is required.';
  if (!draft.schoolYear.trim()) return 'School year is required.';
  if (!isRealIsoDate(draft.lastUpdated)) return 'Last updated must be YYYY-MM-DD.';
  if (!Number.isFinite(draft.goalAmount) || draft.goalAmount <= 0) {
    return 'Goal must be greater than zero.';
  }
  if (!Number.isInteger(draft.suggestedAskPerChild) || draft.suggestedAskPerChild <= 0) {
    return 'Suggested ask must be a whole dollar amount greater than zero.';
  }
  if (!Number.isFinite(draft.onlineRaisedAmount) || draft.onlineRaisedAmount < 0) {
    return 'Online total must be zero or more.';
  }
  if (!Number.isFinite(draft.offlineRaisedAmount) || draft.offlineRaisedAmount < 0) {
    return 'Offline total must be zero or more.';
  }
  if (draft.milestones.length < 1 || draft.milestones.length > 6) {
    return 'Add between 1 and 6 milestones.';
  }

  const ids = new Set<string>();
  for (let index = 0; index < draft.milestones.length; index++) {
    const milestone = draft.milestones[index];
    if (!MILESTONE_ID.test(milestone.id)) {
      return `Milestone ${index + 1} has an invalid id.`;
    }
    if (ids.has(milestone.id)) return 'Milestone ids must be unique.';
    ids.add(milestone.id);
    if (!milestone.label.trim()) return `Milestone ${index + 1} needs a label.`;
    if (!milestone.description.trim()) return `Milestone ${index + 1} needs a description.`;
    if (!Number.isFinite(milestone.amount) || milestone.amount <= 0) {
      return `Milestone ${index + 1} amount must be greater than zero.`;
    }
    if (!isRealIsoDate(milestone.targetDate)) {
      return `Milestone ${index + 1} needs a target date.`;
    }
    if (index > 0 && milestone.amount <= draft.milestones[index - 1].amount) {
      return 'Milestone amounts must increase. Each amount is the cumulative total, not the size of that step.';
    }
  }

  const finalAmount = draft.milestones.at(-1)?.amount;
  if (finalAmount !== draft.goalAmount) {
    return 'The last milestone amount has to equal the goal.';
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseAnnualFundSubmission(
  body: unknown,
): {draft: AnnualFundDraft; ok: true} | {error: string; ok: false} {
  if (!isRecord(body)) return {error: 'Expected a JSON object.', ok: false};

  const onlineRaisedAmount = parseMoney(body.onlineRaisedAmount);
  const offlineRaisedAmount = parseMoney(body.offlineRaisedAmount);
  const goalAmount = parseMoney(body.goalAmount);
  const suggestedAskPerChild = parseWholeDollars(body.suggestedAskPerChild);
  if (onlineRaisedAmount == null) {
    return {error: 'Online total must be a dollar amount, with cents if you have them.', ok: false};
  }
  if (offlineRaisedAmount == null) {
    return {
      error: 'Offline total must be a dollar amount. Count only gifts that have cleared.',
      ok: false,
    };
  }
  if (goalAmount == null || goalAmount <= 0) {
    return {error: 'Goal must be a dollar amount greater than zero.', ok: false};
  }
  if (suggestedAskPerChild == null) {
    return {error: 'Suggested ask must be a whole dollar amount.', ok: false};
  }
  if (typeof body.title !== 'string' || typeof body.schoolYear !== 'string') {
    return {error: 'Title and school year are required.', ok: false};
  }
  if (body.thermometerVisible !== undefined && typeof body.thermometerVisible !== 'boolean') {
    return {error: 'Thermometer visibility must be true or false.', ok: false};
  }
  if (!Array.isArray(body.milestones)) {
    return {error: 'Milestones are required.', ok: false};
  }

  const milestones: FundraisingMilestone[] = [];
  for (const entry of body.milestones) {
    if (!isRecord(entry)) return {error: 'Each milestone must be an object.', ok: false};
    const amount = parseMoney(entry.amount);
    if (
      typeof entry.id !== 'string' ||
      typeof entry.label !== 'string' ||
      typeof entry.description !== 'string' ||
      typeof entry.targetDate !== 'string' ||
      amount == null
    ) {
      return {
        error: 'Each milestone needs an id, label, description, amount, and date.',
        ok: false,
      };
    }
    milestones.push({
      amount,
      description: entry.description.trim(),
      id: entry.id.trim(),
      label: entry.label.trim(),
      targetDate: entry.targetDate,
    });
  }

  const draft: AnnualFundDraft = {
    goalAmount,
    lastUpdated: annualFundAsOfDate(),
    milestones,
    offlineRaisedAmount,
    onlineRaisedAmount,
    schoolYear: body.schoolYear.trim(),
    suggestedAskPerChild,
    thermometerVisible: body.thermometerVisible !== false,
    title: body.title.trim(),
  };
  const error = validateAnnualFundDraft(draft);
  if (error) return {error, ok: false};
  return {draft, ok: true};
}
