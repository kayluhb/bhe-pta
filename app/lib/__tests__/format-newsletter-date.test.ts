import {describe, expect, it} from 'vitest';

import {formatNewsletterDate, toIsoDay} from '../format-newsletter-date';

describe('formatNewsletterDate', () => {
  it('formats ISO days', () => {
    expect(toIsoDay('2026-08-17')).toBe('2026-08-17');
    expect(formatNewsletterDate('2026-08-17')).toBe('August 17, 2026');
  });

  it('formats ISO datetimes and English dates', () => {
    expect(toIsoDay('2026-08-17T18:02:13-05:00')).toBe('2026-08-17');
    expect(toIsoDay('August 17, 2026')).toBe('2026-08-17');
    expect(formatNewsletterDate('August 17, 2026')).toBe('August 17, 2026');
  });

  it('returns empty string for invalid dates', () => {
    expect(formatNewsletterDate('')).toBe('');
    expect(formatNewsletterDate('not-a-date')).toBe('');
  });
});
