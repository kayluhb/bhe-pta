import {afterEach, describe, expect, it, vi} from 'vitest';

import {
  issueReceiptUploadContinuationToken,
  verifyReceiptUploadContinuationToken,
} from '../reimbursement/receipt-upload-token';

describe('receipt-upload-token', () => {
  const secret = 'continuation-secret-for-hmac-testing!!';
  const draftId = '1700000000000-00000000-0000-4000-8000-000000000001';

  afterEach(() => {
    vi.useRealTimers();
  });

  it('issues a token that verifies for the same draft id', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));
    const token = await issueReceiptUploadContinuationToken(secret, draftId);
    expect(await verifyReceiptUploadContinuationToken(token, secret, draftId)).toBe(true);
  });

  it('rejects mismatched draft id, wrong secret, and expired tokens', async () => {
    expect(await verifyReceiptUploadContinuationToken('bad', secret, draftId)).toBe(false);
    expect(await verifyReceiptUploadContinuationToken('a:b', secret, draftId)).toBe(false);
    expect(await verifyReceiptUploadContinuationToken('notint|x|y:sig', secret, draftId)).toBe(
      false,
    );

    const token = await issueReceiptUploadContinuationToken(secret, draftId);
    expect(await verifyReceiptUploadContinuationToken(token, 'wrong-secret', draftId)).toBe(false);
    expect(
      await verifyReceiptUploadContinuationToken(
        token,
        secret,
        '1700000000000-00000000-0000-4000-8000-000000000099',
      ),
    ).toBe(false);

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));
    const t2 = await issueReceiptUploadContinuationToken(secret, draftId);
    vi.setSystemTime(new Date('2026-06-01T12:10:00Z'));
    expect(await verifyReceiptUploadContinuationToken(t2, secret, draftId)).toBe(false);
  });
});
