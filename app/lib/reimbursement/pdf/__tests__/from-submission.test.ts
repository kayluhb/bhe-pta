import {describe, expect, it} from 'vitest';

import {buildPdfDataFromSubmission} from '../from-submission';

describe('buildPdfDataFromSubmission', () => {
  const submission = {
    check_amount: null,
    check_number: null,
    date_approved: null,
    date_paid: null,
    id: 'sub-1',
    requester_email: 'a@bheeagles.com',
    requester_name: 'Alex',
    requester_phone: '  ',
    submitted_at: '2026-02-01T10:00:00Z',
    total_amount: 12.5,
  };

  it('builds split budget when multiple categories', () => {
    const data = buildPdfDataFromSubmission(submission, [
      {
        amount: 10,
        category: ' Library ',
        description: 'Books',
        receipt_date: '2026-02-01',
        vendor: ' Store ',
      },
      {
        amount: 2.5,
        category: 'Garden',
        description: 'Seeds',
        receipt_date: '2026-02-02',
        vendor: null,
      },
    ]);
    expect(data.budget.splitAccounts).toBe(true);
    expect(data.receipts[0]?.placeOfPurchase).toBe(' Store ');
    expect(data.receipts[1]?.placeOfPurchase).toBeUndefined();
    expect(data.requester.phone).toBeUndefined();
    expect(data.submission.checkAmount).toBeNull();
  });

  it('fills treasurer fields when present', () => {
    const data = buildPdfDataFromSubmission(
      {
        ...submission,
        check_amount: Number.NaN,
        check_number: ' 9 ',
        date_approved: ' 2026-03-01 ',
        date_paid: ' 2026-03-02 ',
        total_amount: 5,
      },
      [
        {
          amount: 5,
          category: '',
          description: 'Only',
          receipt_date: '2026-02-01',
          vendor: '',
        },
      ],
    );
    expect(data.budget.primaryAccount).toBe('—');
    expect(data.budget.splitAccounts).toBe(false);
    expect(data.submission.checkAmount).toBeNull();
    expect(data.submission.checkNumber).toBe('9');
    expect(data.submission.dateApproved).toBe('2026-03-01');
    expect(data.submission.datePaid).toBe('2026-03-02');
  });
});
