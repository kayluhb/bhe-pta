function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

function toBase64Url(data: string): string {
  return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return toBase64Url(binary);
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign'],
  );
}

/** HMAC-SHA256 over `${key}:${expSec}` as base64url (no padding). */
export async function signFileAccess(key: string, expSec: number, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const message = `${key}:${expSec}`;
  const hmacKey = await getHmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', hmacKey, encoder.encode(message));
  return bufferToBase64Url(sig);
}

export async function verifyFileAccess(
  key: string,
  expSec: number,
  sigB64Url: string,
  secret: string,
): Promise<boolean> {
  if (!sigB64Url || !Number.isFinite(expSec)) return false;
  if (Math.floor(Date.now() / 1000) > expSec) return false;
  const expected = await signFileAccess(key, expSec, secret);
  return timingSafeEqualString(expected, sigB64Url);
}

/** Default preview URL lifetime (1 hour). */
export const FILE_ACCESS_TTL_SEC = 3600;
