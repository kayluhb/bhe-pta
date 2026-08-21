import {describe, expect, it} from 'vitest';

import {mergeNewslettersByDate, mixNewsletters} from '../mix-newsletters';
import type {Newsletter} from '../types';

function item(
  id: string,
  source: 'school' | 'pta',
  date: string,
): Newsletter {
  return {id, title: id, date, excerpt: '', url: '#', source};
}

describe('mergeNewslettersByDate', () => {
  it('merges school and PTA newest-first by date', () => {
    const school = [
      item('s1', 'school', '2026-08-17'),
      item('s2', 'school', '2026-08-03'),
    ];
    const pta = [
      item('p1', 'pta', '2026-08-10'),
      item('p2', 'pta', '2026-07-15'),
    ];

    expect(mergeNewslettersByDate(school, pta).map((n) => n.id)).toEqual([
      's1',
      'p1',
      's2',
      'p2',
    ]);
  });

  it('handles an empty source', () => {
    const school = [item('s1', 'school', '2026-08-17')];
    expect(mergeNewslettersByDate(school, []).map((n) => n.id)).toEqual(['s1']);
  });
});

describe('mixNewsletters', () => {
  it('interleaves school and PTA so both sources appear', () => {
    const school = [
      item('s1', 'school', '2026-08-17'),
      item('s2', 'school', '2026-08-10'),
      item('s3', 'school', '2026-08-03'),
    ];
    const pta = [
      item('p1', 'pta', '2026-08-01'),
      item('p2', 'pta', '2026-07-15'),
    ];

    const mixed = mixNewsletters(school, pta, 3);
    expect(mixed.map((n) => n.id)).toEqual(['s1', 'p1', 's2']);
    expect(mixed.some((n) => n.source === 'pta')).toBe(true);
    expect(mixed.some((n) => n.source === 'school')).toBe(true);
  });

  it('fills from the remaining source when one side is empty', () => {
    const school = [item('s1', 'school', '2026-08-17'), item('s2', 'school', '2026-08-10')];
    expect(mixNewsletters(school, [], 3).map((n) => n.id)).toEqual(['s1', 's2']);
  });

  it('starts with whichever source has the newest item', () => {
    const school = [item('s1', 'school', '2026-07-01')];
    const pta = [item('p1', 'pta', '2026-08-01'), item('p2', 'pta', '2026-07-15')];
    expect(mixNewsletters(school, pta, 3).map((n) => n.id)).toEqual(['p1', 's1', 'p2']);
  });
});
