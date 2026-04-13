interface GoogleJwk {
  kid?: string;
  kty: string;
  alg?: string;
  n?: string;
  e?: string;
  use?: string;
}

let jwksCache: {keys: GoogleJwk[]; exp: number} | null = null;
const JWKS_TTL_MS = 3_600_000;

function decodeJwtPart(segment: string): string {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  const base64 = padded + '='.repeat(padLen);
  return atob(base64);
}

function base64UrlToUint8Array(segment: string): Uint8Array {
  const binary = decodeJwtPart(segment);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getGoogleJwks(): Promise<GoogleJwk[]> {
  if (jwksCache && Date.now() < jwksCache.exp) {
    return jwksCache.keys;
  }
  const res = await fetch('https://www.googleapis.com/oauth2/v3/certs');
  if (!res.ok) {
    throw new Error(`Google JWKS fetch failed: ${res.status}`);
  }
  const data = (await res.json()) as {keys?: GoogleJwk[]};
  const keys = data.keys ?? [];
  jwksCache = {keys, exp: Date.now() + JWKS_TTL_MS};
  return keys;
}

async function importRsaVerificationKey(jwk: GoogleJwk): Promise<CryptoKey> {
  if (jwk.kty !== 'RSA' || !jwk.n || !jwk.e) {
    throw new Error('Invalid JWK for RSA');
  }
  return crypto.subtle.importKey(
    'jwk',
    {
      kty: 'RSA',
      n: jwk.n,
      e: jwk.e,
      alg: 'RS256',
    },
    {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'},
    false,
    ['verify'],
  );
}

export interface VerifiedGoogleUser {
  email: string;
  name: string;
  picture?: string;
}

/**
 * Verifies Google's RS256 id_token signature and standard claims, then applies @bheeagles.com policy.
 */
export async function verifyGoogleIdToken(
  idToken: string,
  clientId: string,
): Promise<VerifiedGoogleUser | null> {
  const parts = idToken.split('.');
  if (parts.length !== 3) return null;

  let header: {alg?: string; kid?: string};
  let payload: {
    iss?: string;
    aud?: string | string[];
    exp?: number;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
    hd?: string;
  };
  try {
    header = JSON.parse(decodeJwtPart(parts[0])) as {alg?: string; kid?: string};
    payload = JSON.parse(decodeJwtPart(parts[1])) as typeof payload;
  } catch {
    return null;
  }

  if (header.alg !== 'RS256' || !header.kid) return null;

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp < now) return null;

  const iss = payload.iss;
  if (iss !== 'https://accounts.google.com' && iss !== 'accounts.google.com') return null;

  const aud = payload.aud;
  const audOk = Array.isArray(aud) ? aud.includes(clientId) : aud === clientId;
  if (!audOk) return null;

  if (payload.email_verified === false) return null;

  const email = payload.email;
  if (!email?.endsWith('@bheeagles.com')) return null;

  if (payload.hd !== undefined && payload.hd !== 'bheeagles.com') return null;

  const jwks = await getGoogleJwks();
  const jwk = jwks.find((k) => k.kid === header.kid && k.use !== 'enc');
  if (!jwk) return null;

  let key: CryptoKey;
  try {
    key = await importRsaVerificationKey(jwk);
  } catch {
    return null;
  }

  const signedBytes = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  let signature: Uint8Array;
  try {
    signature = base64UrlToUint8Array(parts[2]);
  } catch {
    return null;
  }

  const ok = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    new Uint8Array(signature),
    signedBytes,
  );
  if (!ok) return null;

  return {
    email,
    name: typeof payload.name === 'string' && payload.name ? payload.name : email,
    ...(typeof payload.picture === 'string' && payload.picture ? {picture: payload.picture} : {}),
  };
}
