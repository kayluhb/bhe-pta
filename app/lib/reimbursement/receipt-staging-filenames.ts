import {isValidReimbursementDraftId} from '~/lib/reimbursement/filename';
import {MAX_RECEIPT_LINES} from '~/lib/reimbursement/validation';

/** Lowercase slug for converted receipt filenames (payable-to, no spaces). */
export function slugifyPayableToForReceiptFile(payableTo: string | null): string {
  let slug = (payableTo ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 48);
  if (!slug || /^\d+$/.test(slug)) {
    slug = 'receipt';
  }
  return slug;
}

export function resolveStagingReceiptLineIndex(
  receiptNumber: string | null,
  receiptLineIndex: number | null,
): number {
  const trimmed = receiptNumber?.trim();
  if (trimmed && /^\d+$/.test(trimmed)) {
    const n = Number.parseInt(trimmed, 10);
    if (n >= 1 && n <= MAX_RECEIPT_LINES) {
      return n;
    }
  }
  if (receiptLineIndex != null && receiptLineIndex >= 1 && receiptLineIndex <= MAX_RECEIPT_LINES) {
    return receiptLineIndex;
  }
  return 1;
}

/**
 * Basename for queued converted PDFs in R2 (`uploads/…`) and `converted_filename` on the job.
 * Uses the same reimbursement draft id as the form when present:
 * `{payableSlug}-{draftId}-receipt-{line}-converted.pdf`; otherwise `{slug}-{ts}-{uuid}-receipt-{line}-converted.pdf`.
 */
export function buildConvertedStagingPdfBasename(args: {
  newUuid: string;
  payableTo: string | null;
  receiptLineIndex: number | null;
  receiptNumber: string | null;
  reimbursementDraftId: string | null;
  timestamp: number;
}): string {
  const slug = slugifyPayableToForReceiptFile(args.payableTo);
  const line = resolveStagingReceiptLineIndex(args.receiptNumber, args.receiptLineIndex);
  const raw = args.reimbursementDraftId?.trim() ?? '';
  const idSegment =
    raw && isValidReimbursementDraftId(raw)
      ? raw.toLowerCase()
      : `${args.timestamp}-${args.newUuid}`;
  return `${slug}-${idSegment}-receipt-${line}-converted.pdf`;
}
