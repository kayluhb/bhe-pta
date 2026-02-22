/**
 * Generates a URL-friendly slug from a name and date.
 * e.g. slugifyName("Caleb Brown", "2026-02-21") => "caleb-brown-20260221"
 */
export function slugifyName(name: string, date: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');

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
