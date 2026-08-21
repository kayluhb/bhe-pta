import {describe, expect, it, vi} from 'vitest';

import {
  allSponsors,
  getFeaturedSponsorSchoolYear,
  getRandomSponsors,
  getSponsorTiers,
  getSponsorYearGroup,
  listSponsorSchoolYears,
  resolveSponsorSchoolYear,
  sponsorYearGroups,
  tiers,
} from '../sponsors';

describe('sponsors', () => {
  it('groups sponsors by school year', () => {
    expect(listSponsorSchoolYears()).toEqual(['2026-27', '2025-26']);
    expect(sponsorYearGroups.map((group) => group.schoolYear)).toEqual(['2026-27', '2025-26']);
    expect(
      getSponsorYearGroup('2025-26')?.tiers.flatMap((tier) => tier.sponsors).length,
    ).toBeGreaterThan(0);
    expect(
      getSponsorYearGroup('2026-27')?.tiers.flatMap((tier) => tier.sponsors).length,
    ).toBeGreaterThan(0);
  });

  it('features the newest school year that has sponsors', () => {
    expect(getFeaturedSponsorSchoolYear()).toBe('2026-27');
    expect(resolveSponsorSchoolYear(null)).toBe('2026-27');
    expect(resolveSponsorSchoolYear('2025-26')).toBe('2025-26');
    expect(resolveSponsorSchoolYear('invalid')).toBe('2026-27');
  });

  it('loads tiers for a requested school year', () => {
    expect(getSponsorTiers('2025-26').flatMap((tier) => tier.sponsors).length).toBeGreaterThan(0);
    expect(getSponsorTiers('2026-27').flatMap((tier) => tier.sponsors).length).toBeGreaterThan(0);
    expect(tiers).toEqual(getSponsorTiers());
  });

  it('exposes tiers and a flat sponsor list with fallback', () => {
    expect(tiers.length).toBeGreaterThan(0);
    expect(allSponsors.length).toBeGreaterThan(0);
  });

  it('shuffles deterministically when Math.random is fixed', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.3);
    const pick = getRandomSponsors(3, '2026-27');
    expect(pick).toHaveLength(3);
    vi.restoreAllMocks();
  });

  it('returns at most all sponsors when count is huge', () => {
    const pick = getRandomSponsors(99999, '2026-27');
    expect(pick.length).toBe(allSponsors.length);
  });
});
