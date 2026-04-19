import {describe, expect, it} from 'vitest';

import {mockEvents, mockNewsletters, mockPtaNewsletters} from '../mock-data';

describe('mock-data', () => {
  it('exports non-empty fixtures', () => {
    expect(mockNewsletters.length).toBeGreaterThan(0);
    expect(mockPtaNewsletters.length).toBeGreaterThan(0);
    expect(mockEvents.length).toBeGreaterThan(0);
  });
});
