import type {CampaignConfig} from '~/data/campaigns/types';

export async function getCampaignRaisedCents(
  db: D1Database,
  campaignSlug: string,
): Promise<number> {
  try {
    const row = await db
      .prepare(
        `SELECT COALESCE(SUM(amount_cents), 0) AS total
         FROM donations
         WHERE campaign_slug = ? AND status = 'completed'`,
      )
      .bind(campaignSlug)
      .first<{total: number}>();
    return row?.total ?? 0;
  } catch {
    return 0;
  }
}

export async function getCampaignLastUpdated(
  db: D1Database,
  campaignSlug: string,
): Promise<string> {
  try {
    const row = await db
      .prepare(
        `SELECT MAX(completed_at) AS last_at
         FROM donations
         WHERE campaign_slug = ? AND status = 'completed'`,
      )
      .bind(campaignSlug)
      .first<{last_at: string | null}>();
    if (row?.last_at) {
      return row.last_at.slice(0, 10);
    }
  } catch {
    // table may not exist locally yet
  }
  return new Date().toISOString().slice(0, 10);
}

export async function loadCampaignProgress(
  db: D1Database,
  config: CampaignConfig,
): Promise<{lastUpdated: string; raisedCents: number}> {
  const [raisedCents, lastUpdated] = await Promise.all([
    getCampaignRaisedCents(db, config.slug),
    getCampaignLastUpdated(db, config.slug),
  ]);
  return {raisedCents, lastUpdated};
}
