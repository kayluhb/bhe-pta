import {formatUsd} from '~/lib/format-currency';
import {
  type ReceiptData,
  parseMoneyAmount,
  receiptFieldString,
} from '~/lib/reimbursement/receipt';

export type ReceiptAmountAlertKind = 'tax_included' | 'amount_mismatch';

export interface ReceiptAmountAlert {
  extractedSubtotal: number | null;
  extractedTax: number | null;
  extractedTotal: number | null;
  kind: ReceiptAmountAlertKind;
  message: string;
  submittedAmount: number;
  suggestedAmount: number | null;
}

export interface ExtractedMoneySummary {
  shipping: number | null;
  subtotal: number | null;
  tax: number | null;
  tip: number | null;
  total: number | null;
}

function sumMoneyFields(
  receipts: ReceiptData[],
  key: 'subtotal' | 'shipping' | 'tip' | 'tax' | 'total',
): number | null {
  let sum = 0;
  let found = false;
  for (const r of receipts) {
    const n = parseMoneyAmount(receiptFieldString(r[key]));
    if (n == null) continue;
    sum += n;
    found = true;
  }
  return found ? Math.round(sum * 100) / 100 : null;
}

/** Aggregate money fields across one or more extracted slips. */
export function summarizeExtractedMoney(receipts: ReceiptData[]): ExtractedMoneySummary {
  return {
    shipping: sumMoneyFields(receipts, 'shipping'),
    subtotal: sumMoneyFields(receipts, 'subtotal'),
    tax: sumMoneyFields(receipts, 'tax'),
    tip: sumMoneyFields(receipts, 'tip'),
    total: sumMoneyFields(receipts, 'total'),
  };
}

function nearlyEqual(a: number, b: number, submittedAmount: number): boolean {
  const tol = Math.max(0.03, Math.abs(submittedAmount) * 0.002);
  return Math.abs(a - b) <= tol;
}

/**
 * Preferred reimbursable figure when sales tax should be excluded:
 * grand total − tax, else subtotal + shipping + tip.
 */
export function suggestedReimbursableExTax(money: ExtractedMoneySummary): number | null {
  if (money.total != null && money.tax != null && money.tax >= 0.005) {
    return Math.round((money.total - money.tax) * 100) / 100;
  }
  if (money.subtotal != null) {
    const ship = money.shipping ?? 0;
    const tip = money.tip ?? 0;
    return Math.round((money.subtotal + ship + tip) * 100) / 100;
  }
  return null;
}

/**
 * Compare a submitted/claimed reimbursement amount to Gemini-extracted receipt totals.
 * Flags sales tax included in the claim, and other total mismatches.
 */
export function checkSubmittedAmountAgainstReceipts(
  submittedAmount: number,
  receipts: ReceiptData[],
): ReceiptAmountAlert[] {
  if (!Number.isFinite(submittedAmount) || submittedAmount <= 0) {
    return [];
  }
  const money = summarizeExtractedMoney(receipts);
  if (money.total == null && money.subtotal == null && money.tax == null) {
    return [];
  }

  const alerts: ReceiptAmountAlert[] = [];
  const suggested = suggestedReimbursableExTax(money);
  const tax = money.tax;
  const total = money.total;

  if (
    tax != null &&
    tax >= 0.005 &&
    total != null &&
    nearlyEqual(submittedAmount, total, submittedAmount)
  ) {
    if (suggested == null || !nearlyEqual(submittedAmount, suggested, submittedAmount)) {
      alerts.push({
        extractedSubtotal: money.subtotal,
        extractedTax: tax,
        extractedTotal: total,
        kind: 'tax_included',
        message: `Submitted ${formatUsd(submittedAmount)} matches the receipt grand total including ${formatUsd(tax)} sales tax. Sales tax cannot be reimbursed — suggested amount is ${formatUsd(suggested ?? total - tax)}.`,
        submittedAmount,
        suggestedAmount: suggested ?? Math.round((total - tax) * 100) / 100,
      });
      return alerts;
    }
  }

  const acceptableAnchors = [total, money.subtotal, suggested].filter(
    (n): n is number => n != null,
  );
  if (acceptableAnchors.some((n) => nearlyEqual(submittedAmount, n, submittedAmount))) {
    return alerts;
  }

  if (total != null || money.subtotal != null) {
    const shown = total ?? money.subtotal!;
    const label = total != null ? 'receipt total' : 'receipt subtotal';
    alerts.push({
      extractedSubtotal: money.subtotal,
      extractedTax: tax,
      extractedTotal: total,
      kind: 'amount_mismatch',
      message: `Submitted ${formatUsd(submittedAmount)} does not match the converted ${label} ${formatUsd(shown)} (difference ${formatUsd(Math.abs(submittedAmount - shown))}).`,
      submittedAmount,
      suggestedAmount: suggested ?? total ?? money.subtotal,
    });
  }

  return alerts;
}

/** One-line note for admin_notes / logs. */
export function formatReceiptAmountAlertsForNotes(alerts: ReceiptAmountAlert[]): string {
  if (alerts.length === 0) return '';
  return alerts.map((a) => `[Receipt conversion] ${a.message}`).join('\n');
}

/**
 * Append conversion alerts to existing admin notes without duplicating the same message.
 */
export function mergeAmountAlertsIntoAdminNotes(
  existingNotes: string | null | undefined,
  alerts: ReceiptAmountAlert[],
): string | null {
  const block = formatReceiptAmountAlertsForNotes(alerts);
  if (!block) return existingNotes?.trim() ? existingNotes : null;
  const prev = (existingNotes ?? '').trim();
  if (!prev) return block;
  const newLines = block.split('\n').filter((line) => !prev.includes(line));
  if (newLines.length === 0) return prev;
  return `${prev}\n${newLines.join('\n')}`;
}

/**
 * Pick the best submitted amount to compare: a specific receipt line, else the only
 * line amount, else the submission total.
 */
export function resolveSubmittedAmountForCheck(args: {
  receiptLineAmount?: number | null;
  receiptLineAmounts?: number[];
  submissionTotal?: number | null;
}): number | null {
  const line = args.receiptLineAmount;
  if (line != null && Number.isFinite(line) && line > 0) return line;

  const amounts = (args.receiptLineAmounts ?? []).filter(
    (n) => Number.isFinite(n) && n > 0,
  );
  if (amounts.length === 1) return amounts[0] ?? null;

  const total = args.submissionTotal;
  if (total != null && Number.isFinite(total) && total > 0) return total;
  return null;
}
