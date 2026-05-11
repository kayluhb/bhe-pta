import {describe, expect, it, vi} from 'vitest';

import {requireTurnstile, verifyTurnstile} from '../turnstile';

describe('verifyTurnstile', () => {
  it('posts to Cloudflare and returns success flag', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({success: true}),
    });
    vi.stubGlobal('fetch', fetchMock);
    const ok = await verifyTurnstile('tok', 'sec', '1.2.3.4');
    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({method: 'POST'}),
    );
    const body = (fetchMock.mock.calls[0][1] as RequestInit).body as string;
    expect(body).toContain('secret=sec');
    expect(body).toContain('response=tok');
    expect(body).toContain('remoteip=1.2.3.4');
    vi.unstubAllGlobals();
  });

  it('omits remoteip when ip is null', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({success: false}),
    });
    vi.stubGlobal('fetch', fetchMock);
    expect(await verifyTurnstile('t', 's', null)).toBe(false);
    const body = (fetchMock.mock.calls[0][1] as RequestInit).body as string;
    expect(body).not.toContain('remoteip');
    vi.unstubAllGlobals();
  });
});

describe('requireTurnstile', () => {
  it('returns 403 when token header missing', async () => {
    const res = await requireTurnstile(new Request('https://x.test/'), 'sec');
    expect(res?.status).toBe(403);
  });

  it('returns 403 when verification fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({json: async () => ({success: false})}));
    const req = new Request('https://x.test/', {
      headers: {'X-Turnstile-Token': 'bad'},
    });
    const res = await requireTurnstile(req, 'sec');
    expect(res?.status).toBe(403);
    vi.unstubAllGlobals();
  });

  it('returns null when verification succeeds', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({json: async () => ({success: true})}));
    const req = new Request('https://x.test/', {
      headers: {'X-Turnstile-Token': 'ok'},
    });
    expect(await requireTurnstile(req, 'sec')).toBeNull();
    vi.unstubAllGlobals();
  });
});
