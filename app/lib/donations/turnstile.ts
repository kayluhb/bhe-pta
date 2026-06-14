export async function verifyTurnstile(
  token: string,
  secretKey: string,
  ip: string | null,
): Promise<boolean> {
  const formData = new URLSearchParams();
  formData.append('secret', secretKey);
  formData.append('response', token);
  if (ip) formData.append('remoteip', ip);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    body: formData.toString(),
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    method: 'POST',
  });
  const outcome = (await res.json()) as {success: boolean};
  return outcome.success;
}
