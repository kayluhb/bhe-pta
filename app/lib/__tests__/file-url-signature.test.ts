import {afterEach, describe, expect, it, vi} from 'vitest';

import {
  FILE_ACCESS_TTL_SEC,
  resolveFilePreviewSigningSecret,
  signFileAccess,
  verifyFileAccess,
} from '../reimbursement/file-url-signature';

describe('file-url-signature', () => {
  const secret = 'test-secret-at-least-32-chars-long!!';

  it('signs and verifies a key before expiry', async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const sig = await signFileAccess('uploads/a.pdf', exp, secret);
    expect(await verifyFileAccess('uploads/a.pdf', exp, sig, secret)).toBe(true);
    expect(await verifyFileAccess('uploads/other.pdf', exp, sig, secret)).toBe(false);
  });

  it('rejects expired or invalid params', async () => {
    const exp = Math.floor(Date.now() / 1000) - 10;
    const sig = await signFileAccess('k', exp, secret);
    expect(await verifyFileAccess('k', exp, sig, secret)).toBe(false);
    expect(await verifyFileAccess('k', Number.NaN, 'x', secret)).toBe(false);
    expect(await verifyFileAccess('k', exp, '', secret)).toBe(false);
  });

  it('exposes ttl constant', () => {
    expect(FILE_ACCESS_TTL_SEC).toBe(3600);
  });

  it('resolveFilePreviewSigningSecret prefers dedicated secret', () => {
    expect(
      resolveFilePreviewSigningSecret({
        FILE_URL_SIGNING_SECRET: 'dedicated',
        SESSION_SECRET: 'session',
      }),
    ).toBe('dedicated');
    expect(resolveFilePreviewSigningSecret({SESSION_SECRET: 'only'})).toBe('only');
    expect(resolveFilePreviewSigningSecret({SESSION_SECRET: ''})).toBeUndefined();
  });
});

describe('verifyFileAccess timing', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('rejects when wall clock is past exp', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const secret = 'another-secret-value-for-hmac-tests';
    const exp = Math.floor(Date.now() / 1000) + 60;
    const sig = await signFileAccess('key', exp, secret);
    vi.setSystemTime(new Date('2026-01-01T02:00:00Z'));
    expect(await verifyFileAccess('key', exp, sig, secret)).toBe(false);
  });
});
