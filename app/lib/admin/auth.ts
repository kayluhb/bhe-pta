export interface SessionPayload {
  email: string;
  name: string;
  picture?: string;
}

interface SessionPayloadWithExp extends SessionPayload {
  exp: number;
}

const SESSION_COOKIE_NAME = "admin_session";
const SESSION_TTL_SECONDS = 24 * 60 * 60; // 24 hours

function toBase64Url(data: string): string {
  return btoa(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(data: string): string {
  const padded = data.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded);
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return toBase64Url(binary);
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await getHmacKey(secret);
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data)
  );
  return bufferToBase64Url(signature);
}

async function hmacVerify(
  data: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const key = await getHmacKey(secret);
  const encoder = new TextEncoder();

  // Decode the base64url signature back to ArrayBuffer
  const sigBinary = fromBase64Url(signature);
  const sigBytes = new Uint8Array(sigBinary.length);
  for (let i = 0; i < sigBinary.length; i++) {
    sigBytes[i] = sigBinary.charCodeAt(i);
  }

  return crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes.buffer,
    encoder.encode(data)
  );
}

/**
 * Creates a signed session cookie value from a payload.
 * Format: base64url(json).base64url(hmac-sha256)
 */
export async function signSession(
  payload: SessionPayload,
  secret: string
): Promise<string> {
  const payloadWithExp: SessionPayloadWithExp = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payloadWithExp));
  const signature = await hmacSign(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies a session cookie value and returns the payload if valid.
 * Returns null if the signature is invalid or the session has expired.
 */
export async function verifySession(
  cookie: string,
  secret: string
): Promise<SessionPayload | null> {
  const dotIndex = cookie.indexOf(".");
  if (dotIndex === -1) return null;

  const encodedPayload = cookie.substring(0, dotIndex);
  const signature = cookie.substring(dotIndex + 1);

  if (!encodedPayload || !signature) return null;

  try {
    const valid = await hmacVerify(encodedPayload, signature, secret);
    if (!valid) return null;

    const json = fromBase64Url(encodedPayload);
    const payload: SessionPayloadWithExp = JSON.parse(json);

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return {
      email: payload.email,
      name: payload.name,
      ...(payload.picture ? { picture: payload.picture } : {}),
    };
  } catch {
    return null;
  }
}

/**
 * Reads the admin_session cookie, verifies it, and returns the user payload.
 * Redirects to the Google OAuth login if the session is missing or invalid.
 */
export async function requireAdmin(
  request: Request,
  env: { SESSION_SECRET: string }
): Promise<SessionPayload | Response> {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const cookies = cookieHeader.split("; ");
  const sessionCookie = cookies.find((c) =>
    c.startsWith(`${SESSION_COOKIE_NAME}=`)
  );

  const origin = new URL(request.url).origin;

  if (!sessionCookie) {
    return Response.redirect(`${origin}/api/auth/google`, 302);
  }

  const cookieValue = sessionCookie.substring(SESSION_COOKIE_NAME.length + 1);
  const payload = await verifySession(cookieValue, env.SESSION_SECRET);

  if (!payload) {
    return Response.redirect(`${origin}/api/auth/google`, 302);
  }

  return payload;
}
