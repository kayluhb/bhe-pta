import {describe, expect, it} from 'vitest';

import {buildGiveCheckoutUrl} from '~/lib/give-checkout-url';

describe('buildGiveCheckoutUrl', () => {
  it('always includes campaign UTMs and does not invent amount query params', () => {
    const url = buildGiveCheckoutUrl({
      amount: 650,
      baseUrl: 'https://bhe-pta-annual-fund-drive-2026-2027.cheddarup.com',
      frequency: 'monthly',
      utmContent: 'give-form',
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('utm_source')).toBe('bheeagles');
    expect(parsed.searchParams.get('utm_medium')).toBe('website');
    expect(parsed.searchParams.get('utm_campaign')).toBe('annual-fund-2026-27');
    expect(parsed.searchParams.get('utm_content')).toBe('give-form');
    expect(parsed.searchParams.has('amount')).toBe(false);
    expect(parsed.searchParams.has('frequency')).toBe(false);
  });
});
