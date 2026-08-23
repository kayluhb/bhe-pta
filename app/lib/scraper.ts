import * as cheerio from 'cheerio';
import {toIsoDay} from './format-newsletter-date';
import type {Newsletter} from './types';

const SCHOOL_ORIGIN = 'https://bartonhills.austinschools.org';

const SUBJECT_DATE =
  /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/i;

/** Eagle Update titles usually include the issue date; that beats Drupal's publish time. */
function dateFromSubject(title: string): string | null {
  const match = title.match(SUBJECT_DATE);
  if (!match?.[1]) return null;
  return toIsoDay(match[1]);
}

/** Prefer the subject date, then nested datetime, then URL path, then loose text. */
function resolveNewsletterDate(
  $: cheerio.CheerioAPI,
  $el: cheerio.Cheerio<any>,
  href: string,
  title: string,
): string {
  const fromSubject = dateFromSubject(title);
  if (fromSubject) return fromSubject;

  let datetime = '';
  $el.find('time').each((_, el) => {
    const value = $(el).attr('datetime')?.trim();
    if (value) datetime = value;
  });

  if (datetime) {
    const iso = toIsoDay(datetime);
    if (iso) return iso;
  }

  const urlDateMatch = href.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
  if (urlDateMatch) {
    return `${urlDateMatch[1]}-${urlDateMatch[2]}-${urlDateMatch[3]}`;
  }

  const timeText = $el.find('time').last().text().trim();
  const fromText = toIsoDay(timeText);
  if (fromText) return fromText;

  return new Date().toISOString().split('T')[0]!;
}

function normalizeExcerpt(title: string, excerpt: string): string {
  const trimmed = excerpt.trim();
  if (!trimmed) return '';
  if (trimmed.toLowerCase() === title.trim().toLowerCase()) return '';
  return trimmed.slice(0, 200);
}

function absoluteUrl(href: string): string {
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  if (href.startsWith('//')) return `https:${href}`;
  return `${SCHOOL_ORIGIN}${href.startsWith('/') ? '' : '/'}${href}`;
}

/**
 * Eagle Update Drupal pages usually wrap a single Smore (or PDF) link in the body.
 * Prefer that destination so readers skip the intermediate campus page.
 */
export function extractDestinationUrl(
  html: string,
  fallbackUrl: string,
  title?: string,
): string {
  const $ = cheerio.load(html);
  const links = $('article .content .field--name-body a[href]')
    .toArray()
    .map((el) => {
      const href = $(el).attr('href')?.trim() ?? '';
      return {href: absoluteUrl(href), text: $(el).text().trim()};
    })
    .filter((link) => /^https?:\/\//i.test(link.href));

  if (title) {
    const titleMatch = links.find(
      (link) => link.text.toLowerCase() === title.trim().toLowerCase(),
    );
    if (titleMatch) return titleMatch.href;
  }

  const preferred = links.find((link) =>
    /smore\.com|docs\.google\.com|drive\.google\.com|\.pdf(?:$|\?)/i.test(link.href),
  );
  if (preferred) return preferred.href;

  return links[0]?.href ?? fallbackUrl;
}

async function resolveDestinationUrl(listingUrl: string, title: string): Promise<string> {
  try {
    const response = await fetch(listingUrl);
    if (!response.ok) return listingUrl;
    const html = await response.text();
    return extractDestinationUrl(html, listingUrl, title);
  } catch {
    return listingUrl;
  }
}

export async function scrapeSchoolNews(): Promise<Newsletter[]> {
  const response = await fetch(`${SCHOOL_ORIGIN}/news`);
  const html = await response.text();
  const $ = cheerio.load(html);

  const listing: Array<Omit<Newsletter, 'url'> & {listingUrl: string}> = [];

  // School site uses Drupal with .panel.panel-default for each news item:
  //   <div class="panel panel-default clearfix">
  //     <h2><a href="/news/2026/02/04/eagle-update-...">Eagle Update - ...</a></h2>
  //     <div class="time"><time datetime=""><time datetime="2026-08-17T18:02:13-05:00">...</time></time></div>
  //     <p>Eagle Update - ...</p>  <!-- often duplicates the title -->
  //   </div>
  // Article body typically links out to Smore: <a href="https://app.smore.com/n/...">Eagle Update - ...</a>
  $('.panel.panel-default').each((i, el) => {
    const $el = $(el);
    const titleEl = $el.find('h2 a').first();
    const title = titleEl.text().trim();
    const href = titleEl.attr('href');
    const excerpt = $el.find('p').first().text().trim();

    if (title && href) {
      listing.push({
        id: `school-${i}`,
        title,
        date: resolveNewsletterDate($, $el, href, title),
        excerpt: normalizeExcerpt(title, excerpt),
        listingUrl: absoluteUrl(href),
        source: 'school',
      });
    }
  });

  return Promise.all(
    listing.map(async (item) => {
      const {listingUrl, ...rest} = item;
      const url = await resolveDestinationUrl(listingUrl, item.title);
      return {...rest, url};
    }),
  );
}
