import {describe, expect, it, vi} from 'vitest';

import {extractDestinationUrl, scrapeSchoolNews} from '../scraper';

describe('extractDestinationUrl', () => {
  it('prefers the Smore link in the article body', () => {
    const html = `
      <article class="article">
        <div class="content">
          <div class="field field--name-body field--item">
            <p><a href="https://app.smore.com/n/nm6ys" target="_blank">Eagle Update - August 14, 2026</a></p>
          </div>
        </div>
      </article>
    `;
    expect(
      extractDestinationUrl(
        html,
        'https://bartonhills.austinschools.org/news/2026/08/17/eagle-update-august-14-2026',
        'Eagle Update - August 14, 2026',
      ),
    ).toBe('https://app.smore.com/n/nm6ys');
  });

  it('falls back to the listing URL when body has no outbound link', () => {
    const fallback = 'https://bartonhills.austinschools.org/news/x';
    expect(extractDestinationUrl('<article><div class="content"></div></article>', fallback)).toBe(
      fallback,
    );
  });
});

describe('scrapeSchoolNews', () => {
  it('parses drupal-style panels into newsletters', async () => {
    const html = `
      <div class="panel panel-default clearfix">
        <h2><a href="/news/2026/02/04/eagle-update">Eagle Update</a></h2>
        <div class="time"><time datetime="2026-02-04">February 04, 2026</time></div>
        <p>Short excerpt text here for families.</p>
      </div>
      <div class="panel panel-default">
        <h2><a href="/news/2025/12/01/no-time-element">No Time</a></h2>
        <div class="time"></div>
        <p></p>
      </div>
      <div class="panel panel-default">
        <h2><a href="https://example.com/full-url">External</a></h2>
        <div class="time"></div>
        <p></p>
      </div>
    `;
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes('/news/2026/02/04/eagle-update')) {
        return {
          ok: true,
          text: async () =>
            `<article class="article"><div class="content"><div class="field field--name-body field--item"><p><a href="https://app.smore.com/n/abc">Eagle Update</a></p></div></div></article>`,
        };
      }
      if (String(url).endsWith('/news') || String(url).includes('/news?') || String(url) === 'https://bartonhills.austinschools.org/news') {
        return {ok: true, text: async () => html};
      }
      return {ok: true, text: async () => '<article class="article"><div class="content"></div></article>'};
    });
    vi.stubGlobal('fetch', fetchMock);
    const items = await scrapeSchoolNews();
    expect(items).toHaveLength(3);
    expect(items[0]?.url).toBe('https://app.smore.com/n/abc');
    expect(items[0]?.source).toBe('school');
    expect(items[0]?.date).toBe('2026-02-04');
    expect(items[0]?.excerpt).toBe('Short excerpt text here for families.');
    expect(items[1]?.date).toBe('2025-12-01');
    expect(items[2]?.url.startsWith('http')).toBe(true);
    vi.unstubAllGlobals();
  });

  it('reads nested datetime and drops title-duplicate excerpts', async () => {
    const html = `
      <div class="panel panel-default clearfix">
        <h2><a href="/news/2026/07/20/eagle-update-may-22-2026">Eagle Update - May 22, 2026</a></h2>
        <div class="time"><time datetime=""><time datetime="2026-07-20T15:28:55-05:00">July 20, 2026</time>
</time></div>
        <p>Eagle Update - May 22, 2026</p>
      </div>
    `;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).includes('eagle-update-may-22')) {
          return {
            ok: true,
            text: async () =>
              `<article class="article"><div class="content"><div class="field field--name-body field--item"><p><a href="https://app.smore.com/n/93fap">Eagle Update - May 22, 2026</a></p></div></div></article>`,
          };
        }
        return {ok: true, text: async () => html};
      }),
    );
    const items = await scrapeSchoolNews();
    expect(items).toHaveLength(1);
    expect(items[0]?.date).toBe('2026-07-20');
    expect(items[0]?.excerpt).toBe('');
    expect(items[0]?.url).toBe('https://app.smore.com/n/93fap');
    vi.unstubAllGlobals();
  });
});
