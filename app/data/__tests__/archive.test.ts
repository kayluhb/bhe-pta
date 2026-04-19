import {describe, expect, it} from 'vitest';

import {archiveData} from '../archive';

describe('archiveData', () => {
  it('merges posts into years', () => {
    expect(archiveData.length).toBeGreaterThan(0);
    const withPosts = archiveData.find((y) => (y.posts?.length ?? 0) > 0);
    expect(withPosts).toBeDefined();
  });
});
