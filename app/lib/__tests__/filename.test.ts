import {describe, expect, it} from 'vitest';

import {
  buildAdminReceiptPdfTitle,
  buildPdfFilename,
  buildReceiptFilename,
  buildReceiptPdfTitle,
  buildSubmissionSlug,
  downloadFilenameForR2Object,
  receiptLineFromStorageBasename,
  slugifyName,
  stripEphemeralR2KeyPrefix,
  stripReimbursementDraftIdFromString,
} from '../reimbursement/filename';

describe('buildSubmissionSlug', () => {
  it('combines payable slug with draft id', () => {
    expect(
      buildSubmissionSlug('Kathy Carr', '1778621753152-53750fdd-1f89-4cf1-b78a-0e379015d88e'),
    ).toBe('kathy-carr-1778621753152-53750fdd-1f89-4cf1-b78a-0e379015d88e');
  });
});

describe('slugifyName', () => {
  it('slugifies and appends compact date', () => {
    expect(slugifyName('Caleb Brown!', '2026-02-21')).toBe('caleb-brown-20260221');
  });
});

describe('buildReceiptFilename', () => {
  it('uses extension from filename when present', () => {
    expect(buildReceiptFilename('slug', 0, 'photo.JPEG', 'image/png')).toMatch(/\.jpeg$/i);
  });

  it('falls back to content type map', () => {
    expect(buildReceiptFilename('s', 1, 'noext', 'image/png')).toBe('s-receipt-2.png');
    expect(buildReceiptFilename('s', 0, 'noext', 'application/pdf')).toBe('s-receipt-1.pdf');
    expect(buildReceiptFilename('s', 0, 'noext', 'image/webp')).toBe('s-receipt-1.webp');
    expect(buildReceiptFilename('s', 0, 'noext', 'image/heic')).toBe('s-receipt-1.heic');
    expect(buildReceiptFilename('s', 0, 'noext', 'application/octet-stream')).toBe(
      's-receipt-1.bin',
    );
  });
});

describe('buildPdfFilename', () => {
  it('returns pdf name', () => {
    expect(buildPdfFilename('my-slug')).toBe('my-slug.pdf');
  });
});

describe('receipt PDF titles', () => {
  const draftId = '1778872539008-4b3ae639-cbe1-45b0-8490-f5ebb4b9ed92';

  it('parses receipt line from storage basename', () => {
    expect(
      receiptLineFromStorageBasename(
        `stephanie-white-${draftId}-receipt-2-08a1b2c3-original`,
      ),
    ).toBe(2);
  });

  it('buildReceiptPdfTitle uses numeric receipt line only', () => {
    expect(
      buildReceiptPdfTitle({
        payableTo: 'Stephanie White',
        receiptNumber: `stephanie-white-${draftId}-receipt-2`,
        receiptLine: 2,
      }),
    ).toBe('Stephanie White: Receipt 2');
  });

  it('buildAdminReceiptPdfTitle omits draft id from friendly basenames', () => {
    expect(
      buildAdminReceiptPdfTitle(
        'Stephanie White',
        `stephanie-white-${draftId}-receipt-2-08a1b2c3-original`,
      ),
    ).toBe('Stephanie White: Receipt 2');
  });

  it('stripReimbursementDraftIdFromString removes draft id segment', () => {
    expect(stripReimbursementDraftIdFromString(`foo-${draftId}-bar`)).toBe('foo-bar');
  });

  it('stripEphemeralR2KeyPrefix removes leading staging timestamp-uuid', () => {
    const friendly = `stephanie-white-${draftId}-receipt-1-f8bb06a2-original-converted.pdf`;
    expect(
      stripEphemeralR2KeyPrefix(
        `1779735317537-aba98099-0195-4ff3-ba5f-d8c2fd9393ed-${friendly}`,
      ),
    ).toBe(friendly);
  });

  it('downloadFilenameForR2Object prefers stored original_filename', () => {
    const friendly = `stephanie-white-${draftId}-receipt-1-converted.pdf`;
    const key = `submissions/s1/1779735298959-109dfcd1-7022-4cb8-9ae1-537d47a061e7-${friendly}`;
    expect(downloadFilenameForR2Object(key, friendly)).toBe(friendly);
    expect(downloadFilenameForR2Object(key)).toBe(friendly);
  });
});
