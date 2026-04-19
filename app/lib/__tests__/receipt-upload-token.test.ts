import {afterEach, describe, expect, it, vi} from 'vitest';

import {
  issueReceiptUploadContinuationToken,
  verifyReceiptUploadContinuationToken,
} from '../reimbursement/receipt-upload-token';

describe('receipt-upload-token', () => {
  const secret = 'continuation-secret-for-hmac-testing!!';

  afterEach(() => {
    vi.useRealTimers();
  });

  it('issues a token that verifies', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));
    const token = await issueReceiptUploadContinuationToken(secret);
    expect(await verifyReceiptUploadContinuationToken(token, secret)).toBe(true);
  });

  it('rejects malformed, wrong secret, and expired tokens', async () => {
    expect(await verifyReceiptUploadContinuationToken('bad', secret)).toBe(false);
    expect(await verifyReceiptUploadContinuationToken('a:b', secret)).toBe(false);
    expect(await verifyReceiptUploadContinuationToken('notint|x:sig', secret)).toBe(false);
    const token = await issueReceiptUploadContinuationToken(secret);
    expect(await verifyReceiptUploadContinuationToken(token, 'wrong-secret')).toBe(false);

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));
    const t2 = await issueReceiptUploadContinuationToken(secret);
    vi.setSystemTime(new Date('2026-06-02T12:00:00Z'));
    expect(await verifyReceiptUploadContinuationToken(t2, secret)).toBe(false);
  });
});
