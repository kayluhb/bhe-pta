import {describe, expect, it} from 'vitest';

import {
  adminSubmissionContactSchema,
  adminTreasurerFieldsSchema,
  budgetSelectionSchema,
  fileSchema,
  receiptSchema,
  requesterSchema,
  submissionSchema,
} from '../reimbursement/validation';

describe('validation schemas', () => {
  it('parses a complete submission', () => {
    const data = submissionSchema.parse({
      reimbursementDraftId: '1700000000000-00000000-0000-4000-8000-000000000001',
      requester: {
        payableTo: 'A',
        email: 'a@bheeagles.com',
        phone: '555',
        address: '1 St',
        dateOfRequest: '2026-01-01',
        dateCheckNeeded: '2026-01-15',
        invoiceNumber: '12',
      },
      receipts: [
        {
          date: '2026-01-02',
          description: 'Paper',
          amount: 12.5,
          placeOfPurchase: 'Store',
          budgetAccount: 'Library',
        },
      ],
      files: [
        {
          key: 'uploads/1700000000000-00000000-0000-4000-8000-000000000001-x.jpg',
          filename: 'x.jpg',
          contentType: 'image/jpeg',
          size: 10,
          receiptLineIndex: 1,
        },
      ],
      budget: {primaryAccount: 'Library', splitAccounts: false},
    });
    expect(data.receipts).toHaveLength(1);
  });

  it('rejects invalid staging file keys', () => {
    expect(() =>
      fileSchema.parse({
        key: 'bad-key',
        filename: 'f',
        contentType: 'image/jpeg',
        size: 1,
        receiptLineIndex: 1,
      }),
    ).toThrow();
  });

  it('normalizes admin contact phone blanks to null', () => {
    expect(
      adminSubmissionContactSchema.parse({
        requester_name: 'N',
        requester_email: 'n@bheeagles.com',
        requester_phone: '   ',
      }).requester_phone,
    ).toBeNull();
  });

  it('parses treasurer fields with preprocessors', () => {
    const row = adminTreasurerFieldsSchema.parse({
      check_amount: '',
      check_number: '',
      date_paid: '',
    });
    expect(row.check_amount).toBeNull();
    expect(row.check_number).toBeNull();
    expect(row.date_paid).toBeNull();
    const row2 = adminTreasurerFieldsSchema.parse({
      check_amount: 42,
      check_number: ' 7 ',
      date_paid: '2026-03-01',
    });
    expect(row2.check_amount).toBe(42);
    expect(row2.check_number).toBe('7');
    expect(row2.date_paid).toBe('2026-03-01');
  });

  it('rejects bad receipt rows and budget', () => {
    expect(() =>
      receiptSchema.parse({
        date: '',
        description: 'x',
        amount: -1,
      }),
    ).toThrow();
    expect(() => budgetSelectionSchema.parse({primaryAccount: '', splitAccounts: false})).toThrow();
  });

  it('rejects bad requester email', () => {
    expect(() =>
      requesterSchema.parse({
        payableTo: 'x',
        email: 'not-an-email',
        address: 'a',
        dateOfRequest: '2026-01-01',
        dateCheckNeeded: '2026-01-02',
      }),
    ).toThrow();
  });
});
