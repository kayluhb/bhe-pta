import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

async function rs256Jwt(
  privateKey: CryptoKey,
  kid: string,
  payload: Record<string, unknown>,
): Promise<string> {
  const enc = new TextEncoder();
  const header = {alg: 'RS256', kid};
  const h = Buffer.from(JSON.stringify(header)).toString('base64url');
  const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const data = `${h}.${p}`;
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, enc.encode(data));
  const s = Buffer.from(sig).toString('base64url');
  return `${data}.${s}`;
}

describe('verifyGoogleIdToken', () => {
  let pair: CryptoKeyPair;
  let publicJwk: JsonWebKey;

  beforeEach(async () => {
    vi.resetModules();
    vi.unstubAllGlobals();
    pair = await crypto.subtle.generateKey(
      {
        hash: 'SHA-256',
        modulusLength: 2048,
        name: 'RSASSA-PKCS1-v1_5',
        publicExponent: new Uint8Array([1, 0, 1]),
      },
      true,
      ['sign', 'verify'],
    );
    publicJwk = (await crypto.subtle.exportKey('jwk', pair.publicKey)) as JsonWebKey;
    const pub = publicJwk as JsonWebKey & {kid?: string};
    pub.kid = 'test-kid';
    pub.alg = 'RS256';
    pub.use = 'sig';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function loadWithJwks() {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({keys: [publicJwk]}),
      }),
    );
    return import('../google-id-token');
  }

  it('verifies a valid Google-shaped token', async () => {
    const {verifyGoogleIdToken} = await loadWithJwks();
    const now = Math.floor(Date.now() / 1000);
    const token = await rs256Jwt(pair.privateKey, 'test-kid', {
      iss: 'https://accounts.google.com',
      aud: 'client-id-123',
      email: 'someone@bheeagles.com',
      email_verified: true,
      exp: now + 3600,
      hd: 'bheeagles.com',
      name: 'Someone',
      picture: 'https://example.com/p.png',
    });
    const user = await verifyGoogleIdToken(token, 'client-id-123');
    expect(user).toEqual({
      email: 'someone@bheeagles.com',
      name: 'Someone',
      picture: 'https://example.com/p.png',
    });
  });

  it('uses email as name when name missing', async () => {
    const {verifyGoogleIdToken} = await loadWithJwks();
    const now = Math.floor(Date.now() / 1000);
    const token = await rs256Jwt(pair.privateKey, 'test-kid', {
      iss: 'accounts.google.com',
      aud: ['other', 'client-x'],
      email: 'x@bheeagles.com',
      exp: now + 3600,
    });
    const user = await verifyGoogleIdToken(token, 'client-x');
    expect(user?.name).toBe('x@bheeagles.com');
  });

  it('returns null when alg is not RS256', async () => {
    const {verifyGoogleIdToken} = await loadWithJwks();
    const now = Math.floor(Date.now() / 1000);
    const token = [
      Buffer.from(JSON.stringify({alg: 'HS256', kid: 'test-kid'})).toString('base64url'),
      Buffer.from(
        JSON.stringify({
          iss: 'https://accounts.google.com',
          aud: 'c',
          email: 'x@bheeagles.com',
          exp: now + 3600,
        }),
      ).toString('base64url'),
      'sig',
    ].join('.');
    expect(await verifyGoogleIdToken(token, 'c')).toBeNull();
  });

  it('returns null for malformed JWT segments', async () => {
    const {verifyGoogleIdToken} = await loadWithJwks();
    expect(await verifyGoogleIdToken('a', 'c')).toBeNull();
    expect(await verifyGoogleIdToken('a.b.c.d', 'c')).toBeNull();
    expect(await verifyGoogleIdToken('!!!.!!!.!!!', 'c')).toBeNull();
  });

  it('returns null when token is expired', async () => {
    const {verifyGoogleIdToken} = await loadWithJwks();
    const now = Math.floor(Date.now() / 1000);
    const token = await rs256Jwt(pair.privateKey, 'test-kid', {
      iss: 'https://accounts.google.com',
      aud: 'c',
      email: 'x@bheeagles.com',
      exp: now - 60,
    });
    expect(await verifyGoogleIdToken(token, 'c')).toBeNull();
  });

  it('returns null for issuer, audience, email, hd, and signature problems', async () => {
    const {verifyGoogleIdToken} = await loadWithJwks();
    const now = Math.floor(Date.now() / 1000);
    const base = {
      iss: 'https://accounts.google.com',
      aud: 'c',
      email: 'x@bheeagles.com',
      exp: now + 3600,
    };

    const wrongIss = await rs256Jwt(pair.privateKey, 'test-kid', {...base, iss: 'https://evil'});
    expect(await verifyGoogleIdToken(wrongIss, 'c')).toBeNull();

    const wrongAud = await rs256Jwt(pair.privateKey, 'test-kid', {...base, aud: 'nope'});
    expect(await verifyGoogleIdToken(wrongAud, 'c')).toBeNull();

    const unverified = await rs256Jwt(pair.privateKey, 'test-kid', {
      ...base,
      email_verified: false,
    });
    expect(await verifyGoogleIdToken(unverified, 'c')).toBeNull();

    const badEmail = await rs256Jwt(pair.privateKey, 'test-kid', {...base, email: 'x@gmail.com'});
    expect(await verifyGoogleIdToken(badEmail, 'c')).toBeNull();

    const badHd = await rs256Jwt(pair.privateKey, 'test-kid', {...base, hd: 'other.com'});
    expect(await verifyGoogleIdToken(badHd, 'c')).toBeNull();

    const ok = await rs256Jwt(pair.privateKey, 'test-kid', base);
    expect(await verifyGoogleIdToken(`${ok.slice(0, -6)}xxxxxx`, 'c')).toBeNull();
  });

  it('returns null when JWKS has no matching verification key', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({keys: [{...publicJwk, kid: 'other'}]}),
      }),
    );
    const {verifyGoogleIdToken} = await import('../google-id-token');
    const now = Math.floor(Date.now() / 1000);
    const token = await rs256Jwt(pair.privateKey, 'test-kid', {
      iss: 'https://accounts.google.com',
      aud: 'c',
      email: 'x@bheeagles.com',
      exp: now + 3600,
    });
    expect(await verifyGoogleIdToken(token, 'c')).toBeNull();
  });

  it('returns null when matching key is for encryption only', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          keys: [{...publicJwk, kid: 'test-kid', use: 'enc'}],
        }),
      }),
    );
    const {verifyGoogleIdToken} = await import('../google-id-token');
    const now = Math.floor(Date.now() / 1000);
    const token = await rs256Jwt(pair.privateKey, 'test-kid', {
      iss: 'https://accounts.google.com',
      aud: 'c',
      email: 'x@bheeagles.com',
      exp: now + 3600,
    });
    expect(await verifyGoogleIdToken(token, 'c')).toBeNull();
  });

  it('returns null when RSA JWK is invalid for import', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          keys: [{kty: 'RSA', kid: 'test-kid', n: '!!!', e: 'AQAB', use: 'sig'}],
        }),
      }),
    );
    const {verifyGoogleIdToken} = await import('../google-id-token');
    const now = Math.floor(Date.now() / 1000);
    const token = await rs256Jwt(pair.privateKey, 'test-kid', {
      iss: 'https://accounts.google.com',
      aud: 'c',
      email: 'x@bheeagles.com',
      exp: now + 3600,
    });
    expect(await verifyGoogleIdToken(token, 'c')).toBeNull();
  });

  it('throws when JWKS fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok: false, status: 500}));
    const {verifyGoogleIdToken} = await import('../google-id-token');
    const now = Math.floor(Date.now() / 1000);
    const token = await rs256Jwt(pair.privateKey, 'test-kid', {
      iss: 'https://accounts.google.com',
      aud: 'c',
      email: 'x@bheeagles.com',
      exp: now + 3600,
    });
    await expect(verifyGoogleIdToken(token, 'c')).rejects.toThrow('Google JWKS fetch failed');
  });
});
