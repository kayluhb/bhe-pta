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
