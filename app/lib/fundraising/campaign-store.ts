import type {AnnualFundCampaign, FundraisingMilestone} from '~/data/annual-fund-campaign';

import {
  type AnnualFundDraft,
  campaignFromDraft,
  codeCampaign,
  draftFromCode,
  roundMoney,
  validateAnnualFundDraft,
} from './campaign';

const ROW_ID = 'current';

interface CampaignRow {
  goal_amount: number;
  last_updated: string;
  milestones_json: string;
  offline_raised_amount: number;
  online_raised_amount: number;
  school_year: string;
  suggested_ask_per_child: number;
  thermometer_visible: number | null;
  title: string;
}

export interface LoadedAnnualFundDraft {
  draft: AnnualFundDraft;
  source: 'code' | 'database';
}

function draftFromRow(row: CampaignRow): AnnualFundDraft | null {
  let milestones: FundraisingMilestone[];
  try {
    const parsed = JSON.parse(row.milestones_json) as unknown;
    if (!Array.isArray(parsed)) return null;
    milestones = parsed as FundraisingMilestone[];
  } catch {
    return null;
  }

  return {
    goalAmount: roundMoney(row.goal_amount),
    lastUpdated: row.last_updated,
    milestones: milestones.map((milestone) => ({
      ...milestone,
      amount: roundMoney(milestone.amount),
    })),
    offlineRaisedAmount: roundMoney(row.offline_raised_amount),
    onlineRaisedAmount: roundMoney(row.online_raised_amount),
    schoolYear: row.school_year,
    suggestedAskPerChild: row.suggested_ask_per_child,
    thermometerVisible: row.thermometer_visible !== 0,
    title: row.title,
  };
}

export function isMissingAnnualFundTable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes('no such table');
}

export async function loadAnnualFundDraft(db: D1Database): Promise<LoadedAnnualFundDraft> {
  try {
    const row = await db
      .prepare(
        `SELECT goal_amount, last_updated, milestones_json, offline_raised_amount,
                online_raised_amount, school_year, suggested_ask_per_child,
                thermometer_visible, title
         FROM annual_fund_campaign
         WHERE id = ?`,
      )
      .bind(ROW_ID)
      .first<CampaignRow>();
    if (!row) return {draft: draftFromCode(), source: 'code'};
    const draft = draftFromRow(row);
    if (!draft || validateAnnualFundDraft(draft)) return {draft: draftFromCode(), source: 'code'};
    return {draft, source: 'database'};
  } catch (error) {
    if (isMissingAnnualFundTable(error)) return {draft: draftFromCode(), source: 'code'};
    throw error;
  }
}

export async function loadPublishedCampaign(db: D1Database): Promise<AnnualFundCampaign> {
  const loaded = await loadAnnualFundDraft(db);
  if (loaded.source !== 'database') return codeCampaign();
  return campaignFromDraft(loaded.draft);
}

export async function saveAnnualFundDraft(db: D1Database, draft: AnnualFundDraft): Promise<void> {
  await db
    .prepare(
      `INSERT INTO annual_fund_campaign (
         id, online_raised_amount, offline_raised_amount, goal_amount,
         suggested_ask_per_child, last_updated, school_year, title, milestones_json,
         thermometer_visible, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         online_raised_amount = excluded.online_raised_amount,
         offline_raised_amount = excluded.offline_raised_amount,
         goal_amount = excluded.goal_amount,
         suggested_ask_per_child = excluded.suggested_ask_per_child,
         last_updated = excluded.last_updated,
         school_year = excluded.school_year,
         title = excluded.title,
         milestones_json = excluded.milestones_json,
         thermometer_visible = excluded.thermometer_visible,
         updated_at = datetime('now')`,
    )
    .bind(
      ROW_ID,
      draft.onlineRaisedAmount,
      draft.offlineRaisedAmount,
      draft.goalAmount,
      draft.suggestedAskPerChild,
      draft.lastUpdated,
      draft.schoolYear,
      draft.title,
      JSON.stringify(draft.milestones),
      draft.thermometerVisible ? 1 : 0,
    )
    .run();
}
