import {describe, expect, it} from 'vitest';

import {canProceedToNext} from '~/lib/reimbursement/can-proceed';
import type {FormState} from '~/hooks/useFormState';

function baseState(overrides: Partial<FormState> = {}): FormState {
  return {
    reimbursementDraftId: 'draft',
    requester: {
      payableTo: 'Pat Parent',
      email: 'pat@example.com',
      phone: '',
      address: '2108 Barton Hills Drive',
      dateOfRequest: '2026-11-04',
      dateCheckNeeded: '2026-11-18',
      invoiceNumber: '',
    },
    receipts: [
      {
        clientKey: 'r1',
        date: '2026-11-01',
        description: 'Supplies',
        amount: 12.5,
        placeOfPurchase: 'Store',
        budgetAccount: '',
      },
    ],
    filesByReceipt: [[]],
    budget: {primaryAccount: 'Classroom', splitAccounts: false},
    ...overrides,
  };
}

describe('canProceedToNext', () => {
  it('blocks step 0 when required requester fields are empty', () => {
    const state = baseState({
      requester: {
        ...baseState().requester,
        payableTo: '',
      },
    });
    expect(canProceedToNext(0, state, false)).toBe(false);
  });

  it('requires sales-tax confirmation and positive amounts on step 1', () => {
    expect(canProceedToNext(1, baseState(), false)).toBe(false);
    expect(canProceedToNext(1, baseState(), true)).toBe(true);
  });
});
