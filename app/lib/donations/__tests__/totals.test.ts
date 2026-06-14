import {describe, expect, it, vi} from 'vitest';

import {annualFundCampaign} from '~/data/campaigns/annual-fund';
import {buildCampaignProgress} from '~/data/campaigns/types';
import {getCampaignRaisedCents} from '~/lib/donations/totals';

describe('getCampaignRaisedCents', () => {
  it('sums completed donations', async () => {
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({total: 45_000}),
        }),
      }),
    } as unknown as D1Database;

    const total = await getCampaignRaisedCents(db, annualFundCampaign.slug);
    expect(total).toBe(45_000);
  });

  it('returns 0 when query fails', async () => {
    const db = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockRejectedValue(new Error('no table')),
        }),
      }),
    } as unknown as D1Database;

    expect(await getCampaignRaisedCents(db, annualFundCampaign.slug)).toBe(0);
  });
});

describe('buildCampaignProgress', () => {
  it('includes manual adjustment in raised amount', () => {
    const config = {...annualFundCampaign, manualAdjustmentCents: 10_000};
    const progress = buildCampaignProgress(config, {
      lastUpdated: '2026-06-12',
      raisedCents: 20_000,
    });
    expect(progress.raisedAmount).toBe(300);
  });
});
