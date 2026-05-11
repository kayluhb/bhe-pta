import {describe, expect, it} from 'vitest';

import {fileAttachments, receiptEntries, submissions} from '../schema';

describe('drizzle schema', () => {
  it('defines expected tables', () => {
    expect(submissions).toBeDefined();
    expect(receiptEntries).toBeDefined();
    expect(fileAttachments).toBeDefined();
  });
});
