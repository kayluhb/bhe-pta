export async function verifyTurnstile(
  token: string,
  secretKey: string,
  ip: string | null
): Promise<boolean> {
  const formData = new URLSearchParams();
  formData.append("secret", secretKey);
  formData.append("response", token);
  if (ip) formData.append("remoteip", ip);

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    }
  );
  const outcome = (await res.json()) as { success: boolean };
  return outcome.success;
}

/**
 * Extract and verify Turnstile token from a request header.
 * Returns a 403 Response if verification fails, or null if it succeeds.
 */
export async function requireTurnstile(
  request: Request,
  secretKey: string
): Promise<Response | null> {
  const token = request.headers.get("X-Turnstile-Token");
  if (!token) {
    return Response.json({ error: "Verification required" }, { status: 403 });
  }

  const ip = request.headers.get("CF-Connecting-IP");
  const verified = await verifyTurnstile(token, secretKey, ip);
  if (!verified) {
    return Response.json(
      { error: "Verification failed. Please try again." },
      { status: 403 }
    );
  }

  return null;
}
