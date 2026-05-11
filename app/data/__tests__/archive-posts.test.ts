import {describe, expect, it} from 'vitest';

import {archivePostData} from '../archive-posts';

describe('archivePostData', () => {
  it('loads generated post years', () => {
    expect(archivePostData.length).toBeGreaterThan(0);
  });
});
