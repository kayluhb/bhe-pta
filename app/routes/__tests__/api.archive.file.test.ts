import {describe, expect, it} from 'vitest';

import {isAllowedArchiveKey} from '../api.archive.file';

describe('isAllowedArchiveKey', () => {
  it('allows school-year keys including thumbs and spaces', () => {
    expect(isAllowedArchiveKey('2021-2022/St.-Marks-Block-Party.jpg')).toBe(true);
    expect(isAllowedArchiveKey('2025-2026/thumbs/carnival cakes.png')).toBe(true);
  });

  it('rejects traversal, nested paths, and malformed keys', () => {
    expect(isAllowedArchiveKey('../secret')).toBe(false);
    expect(isAllowedArchiveKey('2021-2022/../secret.jpg')).toBe(false);
    expect(isAllowedArchiveKey('2021-2022/%2e%2e/secret.jpg')).toBe(false);
    expect(isAllowedArchiveKey('/2021-2022/photo.jpg')).toBe(false);
    expect(isAllowedArchiveKey('2021-2022\\photo.jpg')).toBe(false);
    expect(isAllowedArchiveKey('2021-2022/nested/path.jpg')).toBe(false);
    expect(isAllowedArchiveKey('')).toBe(false);
  });
});
