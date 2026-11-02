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

  it('rejects empty or invalid draft ids and legacy two-segment tokens', async () => {
    await expect(issueReceiptUploadContinuationToken(secret, '')).rejects.toThrow(
      'reimbursementDraftId is required for continuation tokens',
    );
    await expect(issueReceiptUploadContinuationToken(secret, 'not-a-draft')).rejects.toThrow(
      'reimbursementDraftId is required for continuation tokens',
    );
    expect(await verifyReceiptUploadContinuationToken('a:b', secret, '')).toBe(false);

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));
    const token = await issueReceiptUploadContinuationToken(secret, draftId);
    const payload = token.slice(0, token.lastIndexOf(':'));
    const sig = token.slice(token.lastIndexOf(':') + 1);
    const twoSegment = `${payload.split('|').slice(0, 2).join('|')}:${sig}`;
    expect(await verifyReceiptUploadContinuationToken(twoSegment, secret, draftId)).toBe(false);
  });

  it('accepts a token still within the 5 minute TTL', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'));
    const token = await issueReceiptUploadContinuationToken(secret, draftId);
    vi.setSystemTime(new Date('2026-06-01T12:04:59Z'));
    expect(await verifyReceiptUploadContinuationToken(token, secret, draftId)).toBe(true);
  });
});
