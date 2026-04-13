import type {PDFData} from '~/lib/reimbursement/pdf/generator';

/** Row shape from `submissions` (fields needed to rebuild the check-request PDF). */
export type SubmissionPdfSource = {
  check_amount: number | null;
  check_number: string | null;
  date_approved: string | null;
  date_paid?: string | null;
  id: string;
  requester_email: string;
  requester_name: string;
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
 * Builds {@link PDFData} from D1 rows. Address and invoice # are not stored; placeholders keep the
 * layout valid. Date received on the PDF is always `submitted_at`. Other treasurer fields when set.
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
      checkAmount:
        submission.check_amount != null && !Number.isNaN(Number(submission.check_amount))
          ? Number(submission.check_amount)
          : null,
      checkNumber: submission.check_number?.trim() ? submission.check_number.trim() : null,
      dateApproved: submission.date_approved?.trim() ? submission.date_approved.trim() : null,
      datePaid: submission.date_paid?.trim() ? submission.date_paid.trim() : null,
      id: submission.id,
      submittedAt: submission.submitted_at,
      totalAmount: Number(submission.total_amount),
    },
  };
}
