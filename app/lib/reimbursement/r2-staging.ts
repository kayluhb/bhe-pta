/**
 * Original uploads from convert-receipt: uploads/{timestamp}-{uuid}-{sanitizedName}.{ext}
 * UUID is crypto.randomUUID() (lowercase hex + hyphens).
 */
const ORIGINAL_STAGING_KEY_RE =
  /^uploads\/\d+-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-[a-zA-Z0-9._-]+\.[a-zA-Z0-9]+$/;

/**
 * Converted PDF while still in staging: uploads/{slug}-{timestamp}-{uuid}-receipt-{n}-converted.pdf
 */
const CONVERTED_STAGING_KEY_RE =
  /^uploads\/[a-z0-9-]+-\d{10,16}-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-receipt-\d+-converted\.pdf$/;

export function isValidStagingUploadKey(key: string): boolean {
  if (!key || key.length > 512) return false;
  if (key.includes('..') || key.includes('\\') || key.startsWith('/')) return false;
  return ORIGINAL_STAGING_KEY_RE.test(key) || CONVERTED_STAGING_KEY_RE.test(key);
}
