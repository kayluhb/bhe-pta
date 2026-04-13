/**
 * Staging keys written by convert-receipt: uploads/{timestamp}-{uuid}-{sanitizedName}.{ext}
 * UUID is crypto.randomUUID() (lowercase hex + hyphens).
 */
const STAGING_KEY_RE =
  /^uploads\/\d+-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-[a-zA-Z0-9._-]+\.[a-zA-Z0-9]+$/;

export function isValidStagingUploadKey(key: string): boolean {
  if (!key || key.length > 512) return false;
  if (key.includes('..') || key.includes('\\') || key.startsWith('/')) return false;
  return STAGING_KEY_RE.test(key);
}
