import {describe, expect, it} from 'vitest';

import {isValidStagingUploadKey} from '../reimbursement/r2-staging';

describe('isValidStagingUploadKey', () => {
  it('accepts well-formed staging keys', () => {
    const key = 'uploads/1700000000000-00000000-0000-4000-8000-000000000001-receipt.jpg';
    expect(isValidStagingUploadKey(key)).toBe(true);
  });

  it('rejects empty, traversal, slashes, and bad patterns', () => {
    expect(isValidStagingUploadKey('')).toBe(false);
    expect(isValidStagingUploadKey('uploads/../x')).toBe(false);
    expect(isValidStagingUploadKey('/uploads/1-a-b-c-d-e-f.jpg')).toBe(false);
    expect(isValidStagingUploadKey('uploads/not-a-uuid.jpg')).toBe(false);
    expect(isValidStagingUploadKey('x'.repeat(513))).toBe(false);
  });
});
