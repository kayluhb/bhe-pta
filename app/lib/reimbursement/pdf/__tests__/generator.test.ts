import {describe, expect, it} from 'vitest';

import {generatePDF} from '../generator';

const baseData = {
  budget: {primaryAccount: 'Library', splitAccounts: false},
  receipts: [
    {
      amount: 10,
      budgetAccount: 'Library',
      date: '2026-02-01',
      description: 'Books',
      placeOfPurchase: 'Store',
    },
    {
      amount: 5,
      budgetAccount: 'Library',
      date: '2026-02-02',
      description: 'Long description '.repeat(8),
      placeOfPurchase: 'X',
    },
  ],
  requester: {
    address: '1 St',
    dateCheckNeeded: '2026-02-15',
    dateOfRequest: '2026-02-01',
    email: 'a@bheeagles.com',
    invoiceNumber: 'INV-1',
    payableTo: 'Alex',
    phone: '555',
  },
  submission: {
    checkAmount: 15,
    checkNumber: '100',
    dateApproved: '2026-02-10',
    datePaid: '2026-02-11',
    id: 'id-1',
    submittedAt: '2026-02-01T12:00:00Z',
    totalAmount: 15,
  },
};

describe('generatePDF', () => {
  it('returns a non-empty PDF buffer', async () => {
    const pdf = await generatePDF(baseData);
    expect(pdf.byteLength).toBeGreaterThan(500);
  });

  it('renders without optional phone and invoice', async () => {
    const {invoiceNumber: _i, phone: _p, ...req} = baseData.requester;
    const pdf = await generatePDF({
      ...baseData,
      requester: req,
      submission: {
        ...baseData.submission,
        checkAmount: null,
        checkNumber: null,
        dateApproved: null,
        datePaid: null,
      },
    });
    expect(pdf.byteLength).toBeGreaterThan(200);
  });
});
