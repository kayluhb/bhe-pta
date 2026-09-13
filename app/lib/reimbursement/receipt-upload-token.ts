/**
 * Short-lived HMAC token so follow-up receipt uploads in the same browser session
 * do not require a fresh Turnstile. Bound to a reimbursement draft id and short TTL.
 * Issued after a successful Turnstile verification on POST /api/reimbursement/convert-receipt.
 */

const TTL_SEC = 5 * 60;

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign', 'verify'],
  );
}

/** Payload: expUnix|nonce|draftId. Signature is base64url HMAC-SHA256 of that string. */
export async function issueReceiptUploadContinuationToken(
  secret: string,
  reimbursementDraftId: string,
): Promise<string> {
  const draftId = reimbursementDraftId.trim();
  if (!draftId) {
    throw new Error('reimbursementDraftId is required for continuation tokens');
  }
  const exp = Math.floor(Date.now() / 1000) + TTL_SEC;
  const nonce = crypto.randomUUID();
  const payload = `${exp}|${nonce}|${draftId}`;
  const encoder = new TextEncoder();
  const hmacKey = await getHmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', hmacKey, encoder.encode(payload));
  const sigPart = bufferToBase64Url(sig);
  return `${payload}:${sigPart}`;
}

export async function verifyReceiptUploadContinuationToken(
  token: string,
  secret: string,
  reimbursementDraftId: string,
): Promise<boolean> {
  const expectedDraft = reimbursementDraftId.trim();
  if (!expectedDraft) return false;

  const parts = token.split(':');
  if (parts.length !== 2) return false;
  const [payload, sigPart] = parts;
  const segments = payload.split('|');
  if (segments.length !== 3) return false;
  const [expStr, , draftId] = segments;
  const exp = Number.parseInt(expStr, 10);
  if (!Number.isFinite(exp)) return false;
  if (Math.floor(Date.now() / 1000) > exp) return false;
  if (draftId !== expectedDraft) return false;

  const encoder = new TextEncoder();
  const hmacKey = await getHmacKey(secret);
  const expectedSig = await crypto.subtle.sign('HMAC', hmacKey, encoder.encode(payload));
  const expected = bufferToBase64Url(expectedSig);
  return timingSafeEqualString(expected, sigPart);
}
