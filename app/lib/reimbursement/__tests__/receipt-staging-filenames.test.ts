import {describe, expect, it} from 'vitest';

import {isValidStagingUploadKey} from '~/lib/reimbursement/r2-staging';

import {
  buildConvertedStagingPdfBasename,
  resolveStagingReceiptLineIndex,
  slugifyPayableToForReceiptFile,
} from '../receipt-staging-filenames';

describe('slugifyPayableToForReceiptFile', () => {
  it('slugifies payable names', () => {
    expect(slugifyPayableToForReceiptFile('Kathy Carr')).toBe('kathy-carr');
    expect(slugifyPayableToForReceiptFile('  PTA / Room 4  ')).toBe('pta-room-4');
  });

  it('uses receipt fallback for empty or numeric-only', () => {
    expect(slugifyPayableToForReceiptFile(null)).toBe('receipt');
    expect(slugifyPayableToForReceiptFile('   ')).toBe('receipt');
    expect(slugifyPayableToForReceiptFile('107')).toBe('receipt');
  });
});

describe('resolveStagingReceiptLineIndex', () => {
  it('prefers valid receipt_number then receipt_line_index', () => {
    expect(resolveStagingReceiptLineIndex('3', 1)).toBe(3);
    expect(resolveStagingReceiptLineIndex(null, 2)).toBe(2);
    expect(resolveStagingReceiptLineIndex('99', null)).toBe(1);
    expect(resolveStagingReceiptLineIndex(null, null)).toBe(1);
  });
});

describe('buildConvertedStagingPdfBasename', () => {
  it('matches short treasurer-style pattern', () => {
    const name = buildConvertedStagingPdfBasename({
      newUuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      payableTo: 'Kathy Carr',
      receiptLineIndex: null,
      receiptNumber: '3',
      reimbursementDraftId: '1778621752980-5ea5d37f-0a8e-48a7-ae18-3d76c0532357',
      timestamp: 1,
    });
    expect(name).toBe(
      'kathy-carr-1778621752980-5ea5d37f-0a8e-48a7-ae18-3d76c0532357-receipt-3-converted.pdf',
    );
    expect(isValidStagingUploadKey(`uploads/${name}`)).toBe(true);
  });
});
