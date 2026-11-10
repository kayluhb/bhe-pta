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
    expect(canProceedToNext(0, state)).toBe(false);
  });

  it('allows step 0 when required requester fields are present', () => {
    expect(canProceedToNext(0, baseState())).toBe(true);
  });

  it('requires receipts with positive amounts on step 1', () => {
    expect(canProceedToNext(1, baseState())).toBe(true);
    expect(canProceedToNext(1, baseState({receipts: []}))).toBe(false);
    expect(
      canProceedToNext(
        1,
        baseState({
          receipts: [{...baseState().receipts[0], amount: 0}],
        }),
      ),
    ).toBe(false);
  });

  it('requires a primary budget account on step 2', () => {
    expect(canProceedToNext(2, baseState())).toBe(true);
    expect(
      canProceedToNext(2, baseState({budget: {primaryAccount: '', splitAccounts: false}})),
    ).toBe(false);
  });

  it('allows review step', () => {
    expect(canProceedToNext(3, baseState())).toBe(true);
  });
});
