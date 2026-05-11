import {describe, expect, it, vi} from 'vitest';

import {scrapeSchoolNews} from '../scraper';

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
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({text: async () => html}));
    const items = await scrapeSchoolNews();
    expect(items).toHaveLength(3);
    expect(items[0]?.url).toContain('bartonhills.austinschools.org');
    expect(items[0]?.source).toBe('school');
    expect(items[1]?.date).toBe('2025-12-01');
    expect(items[2]?.url.startsWith('http')).toBe(true);
    vi.unstubAllGlobals();
  });
});
