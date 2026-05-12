import {describe, expect, it} from 'vitest';

import {submissionSearchCondition} from '../submission-search-sql';

describe('submissionSearchCondition', () => {
  it('matches check_number for text queries', () => {
    const r = submissionSearchCondition('1042a', 's');
    expect(r.sql).toContain('check_number');
    expect(r.binds).toEqual(['%1042a%', '%1042a%', '%1042a%']);
  });

  it('matches check_number for all-digit queries alongside id', () => {
    const r = submissionSearchCondition('7', 's');
    expect(r.sql).toContain('check_number');
    expect(r.binds).toEqual([7, '%7%', '%7%', '%7%']);
  });
});
