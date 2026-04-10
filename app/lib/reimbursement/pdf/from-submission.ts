import type {PDFData} from '~/lib/reimbursement/pdf/generator';

/** Row shape from `submissions` (fields needed to rebuild the check-request PDF). */
export type SubmissionPdfSource = {
  id: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  submitted_at: string;
  total_amount: number;
};

/** Row shape from `receipt_entries` ordered by `sort_order`. */
export type ReceiptEntryPdfSource = {
  receipt_date: string;
  description: string;
  amount: number;
  category: string | null;
  vendor: string | null;
};

/**
 * Builds {@link PDFData} from D1 rows. Address, check dates, and invoice # are not stored in the
 * DB today; placeholders keep the layout valid (same as original submit when those were present).
 */
export function buildPdfDataFromSubmission(
  submission: SubmissionPdfSource,
  entries: ReceiptEntryPdfSource[],
): PDFData {
  const receipts = entries.map((r) => ({
    amount: Number(r.amount),
    budgetAccount: r.category?.trim() ? r.category : '—',
    date: r.receipt_date,
    description: r.description,
    placeOfPurchase: r.vendor?.trim() ? r.vendor : undefined,
  }));

  const categories = entries
    .map((r) => r.category)
    .filter((c): c is string => Boolean(c?.trim()));
  const distinct = new Set(categories);
  const primaryAccount = categories[0] ?? '—';

  return {
    budget: {
      primaryAccount,
      splitAccounts: distinct.size > 1,
    },
    receipts,
    requester: {
      address: '—',
      dateCheckNeeded: submission.submitted_at,
      dateOfRequest: submission.submitted_at,
      email: submission.requester_email,
      payableTo: submission.requester_name,
      phone: submission.requester_phone?.trim() ? submission.requester_phone : undefined,
    },
    submission: {
      id: submission.id,
      submittedAt: submission.submitted_at,
      totalAmount: Number(submission.total_amount),
    },
  };
}
