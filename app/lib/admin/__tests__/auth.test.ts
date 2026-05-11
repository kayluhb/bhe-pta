import {afterEach, describe, expect, it, vi} from 'vitest';

import {requireAdmin, signSession, verifySession} from '../auth';

describe('admin auth', () => {
  const secret = 'session-secret-value-for-hmac-testing!!';

  afterEach(() => {
    vi.useRealTimers();
  });

  it('round-trips session payload', async () => {
    const cookie = await signSession(
      {email: 'a@bheeagles.com', name: 'A', picture: 'http://x'},
      secret,
    );
    const payload = await verifySession(cookie, secret);
    expect(payload).toEqual({email: 'a@bheeagles.com', name: 'A', picture: 'http://x'});
  });

  it('returns null for tampered cookie, bad shape, or expired session', async () => {
    expect(await verifySession('nope', secret)).toBeNull();
    expect(await verifySession('a.b', secret)).toBeNull();
    const cookie = await signSession({email: 'a@bheeagles.com', name: 'A'}, secret);
    const tampered = `${cookie.slice(0, -4)}xxxx`;
    expect(await verifySession(tampered, secret)).toBeNull();
    const badJson = Buffer.from('{"email":"x","name":"y","exp":1}').toString('base64url');
    const sig = cookie.split('.')[1];
    expect(await verifySession(`${badJson}.${sig}`, secret)).toBeNull();
  });

  it('requireAdmin redirects when missing or invalid', async () => {
    const origin = 'https://pta.test';
    const r1 = await requireAdmin(new Request(`${origin}/admin`), {SESSION_SECRET: secret});
    expect(r1 instanceof Response && r1.headers.get('Location')).toContain('/admin/login');

    const r2 = await requireAdmin(
      new Request(`${origin}/admin`, {
        headers: {Cookie: 'admin_session=bad'},
      }),
      {SESSION_SECRET: secret},
    );
    expect(r2 instanceof Response && (r2 as Response).status).toBe(302);
  });

  it('requireAdmin returns payload when valid', async () => {
    const cookie = await signSession({email: 't@bheeagles.com', name: 'T'}, secret);
    const req = new Request('https://pta.test/admin', {
      headers: {Cookie: `admin_session=${cookie}`},
    });
    const out = await requireAdmin(req, {SESSION_SECRET: secret});
    expect(out).toEqual({email: 't@bheeagles.com', name: 'T'});
  });

  it('verifySession returns null when session is expired', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const cookie = await signSession({email: 'e@bheeagles.com', name: 'E'}, secret);
    vi.setSystemTime(new Date('2026-03-01T00:00:00Z'));
    expect(await verifySession(cookie, secret)).toBeNull();
  });
});
