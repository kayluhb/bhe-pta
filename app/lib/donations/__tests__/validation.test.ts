import {describe, expect, it} from 'vitest';

import {annualFundCampaign} from '~/data/campaigns/annual-fund';
import {buildCheckoutSchema, resolveAmountCents} from '~/lib/donations/validation';

describe('resolveAmountCents', () => {
  it('returns preset amount when preset id is valid', () => {
    expect(resolveAmountCents(annualFundCampaign, 'per-child', null)).toBe(20_000);
  });

  it('returns custom amount when allowed', () => {
    expect(resolveAmountCents(annualFundCampaign, null, 15_000)).toBe(15_000);
  });
});

describe('buildCheckoutSchema', () => {
  const schema = buildCheckoutSchema(annualFundCampaign);

  it('accepts valid preset checkout payload', () => {
    const result = schema.safeParse({
      amountCents: 20_000,
      campaignSlug: annualFundCampaign.slug,
      donorEmail: 'parent@example.com',
      donorFields: {studentNames: 'Sam', teacher: 'Ms. Lee'},
      donorName: 'Jane Parent',
      presetId: 'per-child',
      turnstileToken: 'test-token',
    });
    expect(result.success).toBe(true);
  });

  it('rejects amount below minimum', () => {
    const result = schema.safeParse({
      amountCents: 50,
      campaignSlug: annualFundCampaign.slug,
      donorEmail: 'parent@example.com',
      donorFields: {studentNames: '', teacher: ''},
      donorName: 'Jane Parent',
      presetId: null,
      turnstileToken: 'test-token',
    });
    expect(result.success).toBe(false);
  });

  it('rejects preset amount mismatch', () => {
    const result = schema.safeParse({
      amountCents: 40_000,
      campaignSlug: annualFundCampaign.slug,
      donorEmail: 'parent@example.com',
      donorFields: {studentNames: '', teacher: ''},
      donorName: 'Jane Parent',
      presetId: 'per-child',
      turnstileToken: 'test-token',
    });
    expect(result.success).toBe(false);
  });
});
