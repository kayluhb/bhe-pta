import {describe, expect, it} from 'vitest';

import {
  allSponsors,
  getFeaturedSponsors,
  getFeaturedSponsorSchoolYear,
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

  it('features Eagle Pride sponsors first', () => {
    const eaglePride = getSponsorTiers('2026-27')[0]?.sponsors ?? [];
    expect(eaglePride.length).toBeGreaterThan(0);

    const pick = getFeaturedSponsors(6, '2026-27');
    expect(pick).toHaveLength(6);
    expect(pick.slice(0, eaglePride.length).map((sponsor) => sponsor.name)).toEqual(
      eaglePride.map((sponsor) => sponsor.name),
    );
  });

  it('returns at most all sponsors when count is huge', () => {
    const pick = getFeaturedSponsors(99999, '2026-27');
    expect(pick.length).toBe(allSponsors.length);
  });
});
