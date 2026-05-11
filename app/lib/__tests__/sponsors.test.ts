import {describe, expect, it, vi} from 'vitest';

import {allSponsors, getRandomSponsors, tiers} from '../sponsors';

describe('sponsors', () => {
  it('exposes tiers and a flat sponsor list', () => {
    expect(tiers.length).toBeGreaterThan(0);
    expect(allSponsors.length).toBeGreaterThan(0);
  });

  it('shuffles deterministically when Math.random is fixed', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.3);
    const pick = getRandomSponsors(3);
    expect(pick).toHaveLength(3);
    vi.restoreAllMocks();
  });

  it('returns at most all sponsors when count is huge', () => {
    const pick = getRandomSponsors(99999);
    expect(pick.length).toBe(allSponsors.length);
  });
});
