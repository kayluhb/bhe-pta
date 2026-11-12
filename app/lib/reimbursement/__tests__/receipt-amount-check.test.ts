import {describe, expect, it} from 'vitest';

import {
  checkClaimedAmountsAgainstReceipts,
  checkSubmittedAmountAgainstReceipts,
  mergeAmountAlertsIntoAdminNotes,
  resolveSubmittedAmountForCheck,
  stripReceiptConversionNotes,
  suggestedReimbursableExTax,
  summarizeExtractedMoney,
} from '../receipt-amount-check';

describe('checkSubmittedAmountAgainstReceipts', () => {
  it("flags when the claim matches the grand total that includes sales tax (Sam's Club)", () => {
    const alerts = checkSubmittedAmountAgainstReceipts(302.52, [
      {
        subtotal: '295.79',
        tax: '6.73',
        total: '302.52',
        vendor_name: "sam's club",
      },
    ]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.kind).toBe('tax_included');
    expect(alerts[0]?.suggestedAmount).toBe(295.79);
    expect(alerts[0]?.message).toContain('sales tax');
  });

  it('flags when the claim does not match the converted receipt total (Target $24.31 vs $23.31)', () => {
    const alerts = checkSubmittedAmountAgainstReceipts(24.31, [
      {
        subtotal: '23.31',
        tax: '0',
        total: '23.31',
        vendor_name: 'Target',
      },
    ]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.kind).toBe('amount_mismatch');
    expect(alerts[0]?.extractedTotal).toBe(23.31);
    expect(alerts[0]?.suggestedAmount).toBe(23.31);
    expect(alerts[0]?.message).toContain('$24.31');
    expect(alerts[0]?.message).toContain('$23.31');
  });

  it('stays quiet when the claim matches the pre-tax / merchandise total', () => {
    const alerts = checkSubmittedAmountAgainstReceipts(295.79, [
      {subtotal: '295.79', tax: '6.73', total: '302.52'},
    ]);
    expect(alerts).toHaveLength(0);
  });

  it('stays quiet when the claim matches the grand total and there is no tax', () => {
    const alerts = checkSubmittedAmountAgainstReceipts(23.31, [
      {subtotal: '23.31', tax: '0', total: '23.31'},
    ]);
    expect(alerts).toHaveLength(0);
  });
});

describe('checkClaimedAmountsAgainstReceipts', () => {
  it('matches one converted slip to its receipt line on multi-line submissions (no false positive)', () => {
    const alerts = checkClaimedAmountsAgainstReceipts({
      claimedAmounts: [677.98, 41.25, 534.6],
      receipts: [{subtotal: '677.98', tax: '0', total: '677.98', vendor_name: 'Central Market'}],
    });
    expect(alerts).toHaveLength(0);
  });

  it('still flags tax included against the matching line among several claims', () => {
    const alerts = checkClaimedAmountsAgainstReceipts({
      claimedAmounts: [302.52, 23.31],
      receipts: [{subtotal: '295.79', tax: '6.73', total: '302.52'}],
    });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.kind).toBe('tax_included');
    expect(alerts[0]?.submittedAmount).toBe(302.52);
  });

  it('allows extracted total to match the sum of all receipt lines', () => {
    const alerts = checkClaimedAmountsAgainstReceipts({
      claimedAmounts: [677.98, 41.25, 534.6],
      receipts: [{total: '1253.83'}],
    });
    expect(alerts).toHaveLength(0);
  });
});

describe('summarizeExtractedMoney / suggestedReimbursableExTax', () => {
  it('sums multiple slips', () => {
    const money = summarizeExtractedMoney([
      {subtotal: '10', tax: '1', total: '11'},
      {subtotal: '20', tax: '2', total: '22'},
    ]);
    expect(money).toEqual({
      shipping: null,
      subtotal: 30,
      tax: 3,
      tip: null,
      total: 33,
    });
    expect(suggestedReimbursableExTax(money)).toBe(30);
  });
});

describe('mergeAmountAlertsIntoAdminNotes', () => {
  it('appends without duplicating', () => {
    const alerts = checkSubmittedAmountAgainstReceipts(24.31, [{total: '23.31'}]);
    const once = mergeAmountAlertsIntoAdminNotes(null, alerts);
    expect(once).toContain('[Receipt conversion]');
    const twice = mergeAmountAlertsIntoAdminNotes(once, alerts);
    expect(twice).toBe(once);
  });
});

describe('stripReceiptConversionNotes', () => {
  it('removes conversion alert lines and keeps other notes', () => {
    const stripped = stripReceiptConversionNotes(
      'Keep me\n[Receipt conversion] Submitted $1,253.83 does not match\nAlso keep',
    );
    expect(stripped).toBe('Keep me\nAlso keep');
  });
});

describe('resolveSubmittedAmountForCheck', () => {
  it('prefers the receipt line, then sole line; does not use multi-line submission total', () => {
    expect(
      resolveSubmittedAmountForCheck({
        receiptLineAmount: 10,
        receiptLineAmounts: [10, 20],
        submissionTotal: 30,
      }),
    ).toBe(10);
    expect(
      resolveSubmittedAmountForCheck({
        receiptLineAmounts: [24.31],
        submissionTotal: 24.31,
      }),
    ).toBe(24.31);
    expect(
      resolveSubmittedAmountForCheck({
        receiptLineAmounts: [10, 20],
        submissionTotal: 30,
      }),
    ).toBeNull();
    expect(
      resolveSubmittedAmountForCheck({
        receiptLineAmounts: [],
        submissionTotal: 30,
      }),
    ).toBe(30);
  });
});
