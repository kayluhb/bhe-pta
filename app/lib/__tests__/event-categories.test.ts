import {describe, expect, it} from 'vitest';

import {
  eventMatchesFilter,
  filterIdForCategory,
  tintForFilter,
  type EventFilterId,
} from '~/lib/event-categories';

describe('event-categories', () => {
  it('maps known categories onto filter ids and tints', () => {
    expect(filterIdForCategory('Community Event')).toBe('community');
    expect(filterIdForCategory('PTA Meeting')).toBe('pta');
    expect(filterIdForCategory('Prospective Parent Tour')).toBe('prospective');
    expect(tintForFilter('community')).toBe('green');
    expect(tintForFilter('pta')).toBe('blue');
    expect(tintForFilter('prospective')).toBe('gold');
  });

  it('keeps unknown categories visible under All with community default tint', () => {
    expect(filterIdForCategory('Fine Arts')).toBe('community');
    expect(eventMatchesFilter({category: 'Fine Arts'}, 'all')).toBe(true);
    expect(eventMatchesFilter({category: 'Fine Arts'}, 'community')).toBe(true);
    expect(eventMatchesFilter({category: 'PTA Meeting'}, 'community' as EventFilterId)).toBe(
      false,
    );
  });
});
