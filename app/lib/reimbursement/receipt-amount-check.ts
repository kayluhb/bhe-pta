import {formatUsd} from '~/lib/format-currency';
import {parseMoneyAmount, type ReceiptData, receiptFieldString} from '~/lib/reimbursement/receipt';

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

function nearlyEqual(a: number, b: number, scaleAmount: number): boolean {
  const tol = Math.max(0.03, Math.abs(scaleAmount) * 0.002);
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

function positiveAmounts(values: Array<number | null | undefined>): number[] {
  return values.filter((n): n is number => n != null && Number.isFinite(n) && n > 0);
}

function findMatchingClaim(claimedAmounts: number[], anchors: number[]): number | null {
  for (const claimed of claimedAmounts) {
    if (anchors.some((anchor) => nearlyEqual(claimed, anchor, claimed))) {
      return claimed;
    }
  }
  return null;
}

function closestClaim(claimedAmounts: number[], target: number): number {
  return claimedAmounts.reduce((best, n) =>
    Math.abs(n - target) < Math.abs(best - target) ? n : best,
  );
}

/**
 * Compare one claimed amount to Gemini-extracted receipt totals.
 * Flags sales tax included in the claim, and other total mismatches.
 */
export function checkSubmittedAmountAgainstReceipts(
  submittedAmount: number,
  receipts: ReceiptData[],
): ReceiptAmountAlert[] {
  return checkClaimedAmountsAgainstReceipts({
    claimedAmounts: [submittedAmount],
    receipts,
  });
}

/**
 * Compare extracted receipt money to one or more claimed receipt-line amounts.
 *
 * When a submission has multiple lines (e.g. Central Market + Target + ThunderCloud),
 * converting a single attachment must match that slip to the corresponding line —
 * not the full submission total.
 */
export function checkClaimedAmountsAgainstReceipts(args: {
  claimedAmounts: number[];
  preferredClaimedAmount?: number | null;
  receipts: ReceiptData[];
}): ReceiptAmountAlert[] {
  const claimedAmounts = positiveAmounts(
    args.preferredClaimedAmount != null ? [args.preferredClaimedAmount] : args.claimedAmounts,
  );
  if (claimedAmounts.length === 0) return [];

  const money = summarizeExtractedMoney(args.receipts);
  if (money.total == null && money.subtotal == null && money.tax == null) {
    return [];
  }

  const suggested = suggestedReimbursableExTax(money);
  const tax = money.tax;
  const total = money.total;
  const acceptableAnchors = [total, money.subtotal, suggested].filter(
    (n): n is number => n != null,
  );

  // Tax included: a claimed line (or sole claim) equals the grand total that still has tax.
  if (tax != null && tax >= 0.005 && total != null) {
    const taxClaim = findMatchingClaim(claimedAmounts, [total]);
    if (taxClaim != null && (suggested == null || !nearlyEqual(taxClaim, suggested, taxClaim))) {
      return [
        {
          extractedSubtotal: money.subtotal,
          extractedTax: tax,
          extractedTotal: total,
          kind: 'tax_included',
          message: `Submitted ${formatUsd(taxClaim)} matches the receipt grand total including ${formatUsd(tax)} sales tax. Sales tax cannot be reimbursed — suggested amount is ${formatUsd(suggested ?? total - tax)}.`,
          submittedAmount: taxClaim,
          suggestedAmount: suggested ?? Math.round((total - tax) * 100) / 100,
        },
      ];
    }
  }

  if (findMatchingClaim(claimedAmounts, acceptableAnchors) != null) {
    return [];
  }

  // Multi-line submission: extracted total may equal the sum of all claims (combined PDF).
  if (claimedAmounts.length > 1 && acceptableAnchors.length > 0) {
    const claimSum = Math.round(claimedAmounts.reduce((s, n) => s + n, 0) * 100) / 100;
    if (acceptableAnchors.some((anchor) => nearlyEqual(claimSum, anchor, claimSum))) {
      return [];
    }
  }

  const shown = total ?? money.subtotal;
  if (shown == null) return [];

  const compared =
    claimedAmounts.length === 1 ? claimedAmounts[0]! : closestClaim(claimedAmounts, shown);
  const label = total != null ? 'receipt total' : 'receipt subtotal';
  const multiHint =
    claimedAmounts.length > 1
      ? ` Closest receipt line is ${formatUsd(compared)}; converted slip does not match any line amount.`
      : '';

  return [
    {
      extractedSubtotal: money.subtotal,
      extractedTax: tax,
      extractedTotal: total,
      kind: 'amount_mismatch',
      message: `Submitted ${formatUsd(compared)} does not match the converted ${label} ${formatUsd(shown)} (difference ${formatUsd(Math.abs(compared - shown))}).${multiHint}`,
      submittedAmount: compared,
      suggestedAmount: suggested ?? total ?? money.subtotal,
    },
  ];
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
 * Remove prior `[Receipt conversion] …` lines (e.g. after a false-positive fix / re-convert).
 */
export function stripReceiptConversionNotes(
  existingNotes: string | null | undefined,
): string | null {
  if (!existingNotes) return null;
  const kept = existingNotes
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => !line.trim().startsWith('[Receipt conversion]'));
  while (kept.length > 0 && kept[0]?.trim() === '') kept.shift();
  while (kept.length > 0 && kept[kept.length - 1]?.trim() === '') kept.pop();
  const out = kept.join('\n').trim();
  return out.length > 0 ? out : null;
}

/**
 * Pick a single claimed amount when the caller already knows the line.
 * Prefer that line; else the only line amount. Do **not** fall back to the
 * multi-line submission total — callers should pass all line amounts into
 * {@link checkClaimedAmountsAgainstReceipts} instead.
 */
export function resolveSubmittedAmountForCheck(args: {
  receiptLineAmount?: number | null;
  receiptLineAmounts?: number[];
  submissionTotal?: number | null;
}): number | null {
  const line = args.receiptLineAmount;
  if (line != null && Number.isFinite(line) && line > 0) return line;

  const amounts = positiveAmounts(args.receiptLineAmounts ?? []);
  if (amounts.length === 1) return amounts[0] ?? null;

  // Single-line submissions sometimes only store total_amount.
  if (amounts.length === 0) {
    const total = args.submissionTotal;
    if (total != null && Number.isFinite(total) && total > 0) return total;
  }
  return null;
}
