import {describe, expect, it, vi} from 'vitest';

import {fetchMailchimpCampaigns} from '../mailchimp';

describe('fetchMailchimpCampaigns', () => {
  it('throws when API key has no datacenter suffix', async () => {
    await expect(fetchMailchimpCampaigns('prefix-')).rejects.toThrow('datacenter suffix');
  });

  it('throws when list API is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok: false, status: 401}));
    await expect(fetchMailchimpCampaigns('key-us1')).rejects.toThrow('Mailchimp API error');
    vi.unstubAllGlobals();
  });

  it('maps campaigns and prefers content excerpts', async () => {
    const listJson = {
      campaigns: [
        {
          id: 'c1',
          settings: {subject_line: 'Hello *|MC:SUBJECT|*', preview_text: 'Hello'},
          send_time: '2026-01-02T12:00:00Z',
          archive_url: 'https://mailchi.mp/1',
        },
      ],
    };
    const contentJson = {
      plain_text: 'Body *|MC_PREVIEW_TEXT|* with <b>html</b> &nbsp; &amp; text',
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/campaigns?')) {
          return Promise.resolve({
            ok: true,
            json: async () => listJson,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => contentJson,
        });
      }),
    );
    const out = await fetchMailchimpCampaigns('abc-us9');
    expect(out).toHaveLength(1);
    expect(out[0]?.excerpt.length).toBeGreaterThan(0);
    expect(out[0]?.source).toBe('pta');
    vi.unstubAllGlobals();
  });

  it('falls back to html and truncates long excerpts at word boundary', async () => {
    const longHtml = `<p>${'word '.repeat(200)}</p>`;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/campaigns?')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              campaigns: [
                {
                  id: 'c2',
                  settings: {subject_line: 'S', preview_text: 'S'},
                  send_time: '2026-01-01T00:00:00Z',
                },
              ],
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({html: longHtml}),
        });
      }),
    );
    const out = await fetchMailchimpCampaigns('k-us1');
    expect(out[0]?.excerpt.endsWith('…')).toBe(true);
    vi.unstubAllGlobals();
  });

  it('uses preview when content fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/campaigns?')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              campaigns: [
                {
                  id: 'c3',
                  settings: {subject_line: 'Title', preview_text: 'Different preview'},
                  send_time: '2026-01-01T00:00:00Z',
                },
              ],
            }),
          });
        }
        return Promise.resolve({ok: false, status: 500});
      }),
    );
    const out = await fetchMailchimpCampaigns('k-us1');
    expect(out[0]?.excerpt).toContain('Different');
    vi.unstubAllGlobals();
  });

  it('truncates a single long token without spaces using hard slice', async () => {
    const oneWord = 'x'.repeat(400);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/campaigns?')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              campaigns: [
                {
                  id: 'c5',
                  settings: {subject_line: 'S', preview_text: ''},
                  send_time: '2026-01-01T00:00:00Z',
                },
              ],
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({html: `<p>${oneWord}</p>`}),
        });
      }),
    );
    const out = await fetchMailchimpCampaigns('k-us1');
    expect(out[0]?.excerpt.endsWith('…')).toBe(true);
    vi.unstubAllGlobals();
  });

  it('swallows excerpt fetch errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/campaigns?')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              campaigns: [
                {
                  id: 'c4',
                  settings: {subject_line: 'Only', preview_text: ''},
                  send_time: '2026-01-01T00:00:00Z',
                },
              ],
            }),
          });
        }
        return Promise.reject(new Error('network'));
      }),
    );
    const out = await fetchMailchimpCampaigns('k-us1');
    expect(out[0]?.excerpt).toBe('');
    vi.unstubAllGlobals();
  });
});
