/** Lowercase name segment for submission / receipt filenames (no date). */
export function slugifyPayableName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Client-generated id for one reimbursement draft: `{ms}-{uuid}`.
 * Used in submission PDF and attachment basenames instead of calendar date.
 */
export const REIMBURSEMENT_DRAFT_ID_RE =
  /^\d{10,20}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidReimbursementDraftId(id: string): boolean {
  return REIMBURSEMENT_DRAFT_ID_RE.test(id.trim());
}

export function buildSubmissionSlug(payableTo: string, reimbursementDraftId: string): string {
  const nameSlug = slugifyPayableName(payableTo.trim()) || 'receipt';
  const rid = reimbursementDraftId.trim().toLowerCase();
  if (!isValidReimbursementDraftId(rid)) {
    throw new Error('Invalid reimbursement draft id');
  }
  return `${nameSlug}-${rid}`;
}

/**
 * Legacy date-based slug (e.g. regenerate fallback when `pdf_key` is missing).
 * e.g. slugifyName("Caleb Brown", "2026-02-21") => "caleb-brown-20260221"
 */
export function slugifyName(name: string, date: string): string {
  const slug = slugifyPayableName(name);
  const dateStr = date.replace(/-/g, '');
  return `${slug}-${dateStr}`;
}

/**
 * Returns the file extension from a filename or content type.
 */
function getExtension(filename: string, contentType: string): string {
  const fromName = filename.split('.').pop()?.toLowerCase();
  if (fromName && fromName !== filename.toLowerCase()) return fromName;

  const typeMap: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
  };
  return typeMap[contentType] || 'bin';
}

/**
 * Builds friendly filenames for a submission's files.
 */
export function buildReceiptFilename(
  slug: string,
  index: number,
  originalFilename: string,
  contentType: string,
): string {
  const ext = getExtension(originalFilename, contentType);
  return `${slug}-receipt-${index + 1}.${ext}`;
}

export function buildPdfFilename(slug: string): string {
  return `${slug}.pdf`;
}

const MAX_RECEIPT_LINE_FOR_PDF_TITLE = 10;

/** Parse 1-based receipt line from friendly storage basenames (`…-receipt-2-…`). */
export function receiptLineFromStorageBasename(basename: string): number | undefined {
  const match = basename.match(/-receipt-(\d+)(?:-|\.|$)/i);
  if (!match) return undefined;
  const line = Number.parseInt(match[1], 10);
  if (line < 1 || line > MAX_RECEIPT_LINE_FOR_PDF_TITLE) return undefined;
  return line;
}

const REIMBURSEMENT_DRAFT_ID_SEGMENT_RE =
  /\d{10,20}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/** Remove `{ms}-{uuid}` draft ids from display strings (PDF titles, labels). */
export function stripReimbursementDraftIdFromString(text: string): string {
  return text
    .replace(REIMBURSEMENT_DRAFT_ID_SEGMENT_RE, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Centered header for AI-generated receipt PDFs — never includes draft ids or R2 keys. */
export function buildReceiptPdfTitle(args: {
  payableTo?: string | null;
  receiptLine?: number | null;
  receiptNumber?: string | null;
  requesterName?: string | null;
}): string {
  const person = (args.payableTo ?? args.requesterName ?? '').trim();
  let line = args.receiptLine ?? undefined;
  if (line == null && args.receiptNumber != null) {
    const trimmed = args.receiptNumber.trim();
    if (/^\d+$/.test(trimmed)) {
      const parsed = Number.parseInt(trimmed, 10);
      if (parsed >= 1 && parsed <= MAX_RECEIPT_LINE_FOR_PDF_TITLE) {
        line = parsed;
      }
    }
  }
  const lineLabel = line ?? 1;
  if (person) return `${person}: Receipt ${lineLabel}`;
  return 'Receipt Transcript';
}

/**
 * Admin re-convert / upload titles: use receipt line when encoded in the basename;
 * otherwise a human label with draft ids and job suffixes stripped.
 */
/**
 * Staging/admin R2 keys sometimes prefix basenames with `{ms}-{uuid}-` for uniqueness.
 * Strip that for downloads so filenames start with the payable slug (e.g. stephanie-white-…).
 */
const EPHEMERAL_R2_KEY_PREFIX_RE =
  /^\d{10,20}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i;

export function stripEphemeralR2KeyPrefix(basename: string): string {
  const stripped = basename.replace(EPHEMERAL_R2_KEY_PREFIX_RE, '');
  return stripped || basename;
}

/** Filename for Content-Disposition (and ZIP entries); prefers DB `original_filename`. */
export function downloadFilenameForR2Object(
  r2Key: string,
  storedOriginalFilename?: string | null,
): string {
  const fromDb = storedOriginalFilename?.trim();
  if (fromDb) return fromDb;
  const basename = r2Key.split('/').pop() || 'download';
  return stripEphemeralR2KeyPrefix(basename);
}

export function buildAdminReceiptPdfTitle(requesterName: string, storageBasename: string): string {
  const line = receiptLineFromStorageBasename(storageBasename);
  if (line != null) {
    return buildReceiptPdfTitle({requesterName, receiptLine: line});
  }
  let label = storageBasename.replace(/-original$/i, '').replace(/-converted$/i, '');
  label = stripReimbursementDraftIdFromString(label);
  label = label.replace(/-[0-9a-f]{8}$/i, '');
  label = label.replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '');
  if (!label) label = 'Receipt';
  return `${requesterName.trim()}: ${label}`;
}
