/**
 * One-off: scrape/enrich newsletter imageUrl fields and write them to remote KV.
 * Usage: node scripts/backfill-newsletter-images.mjs
 */
import {execFileSync} from 'node:child_process';
import {mkdtempSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

// Extractors mirrored from app/lib/newsletter-image.ts for a dependency-light one-off.

const SKIP_IMAGE_HOST =
  /cdn-images\.mailchimp\.com|list-manage\.com\/track|facebook\.com|twitter\.com|instagram\.com|googleusercontent\.com\/proxy|fonts\.gstatic\.com|twemoji|emoji/i;
const SKIP_IMAGE_PATH = /\/icons\/|monkey_rewards|open\.gif|pixel|spacer|1x1|\/emoji\//i;
const PREFERRED_IMAGE_HOST = /mcusercontent\.com|gallery\.mailchimp\.com/i;
const MAILCHIMP_U = 'bec8051159f5dd775329aa6af';
const SCHOOL_KV = '4c77b6f69f774a458fa7e1c312f9115d';
const PTA_KV = '2c28fd7859d24acfacbda32a83f27015';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function absoluteImageUrl(src) {
  const trimmed = src.trim();
  if (!trimmed || trimmed.startsWith('data:')) return undefined;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return undefined;
}

function scoreCandidate({dropZone, height, width}) {
  let score = 0;
  if (dropZone) score -= 40;
  if (width > 0 && width < 160) score -= 50;
  if (height > 0 && height < 120) score -= 50;
  if (width > 0 && height > 0) {
    const ratio = width / height;
    if (ratio >= 1.15 && ratio <= 2.4) score += 80;
    else if (ratio >= 0.95 && ratio < 1.15) score += 35;
    else if (ratio > 2.4) score += 20;
    else score -= 60;
    score += Math.min(width, 900) / 20;
  } else if (width > 0) {
    if (width >= 480 && width <= 700) score += 40;
    else if (width > 700) score += 20;
    else score += width / 30;
  }
  return score;
}

function extractMailchimpImageUrl(html) {
  const tags = html.match(/<img\b[^>]*>/gi) ?? [];
  const seen = new Set();
  const candidates = [];
  for (const tag of tags) {
    const srcMatch = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    const url = srcMatch?.[1] ? absoluteImageUrl(srcMatch[1]) : undefined;
    if (!url || seen.has(url)) continue;
    if (SKIP_IMAGE_HOST.test(url) || SKIP_IMAGE_PATH.test(url)) continue;
    if (!(PREFERRED_IMAGE_HOST.test(url) || /\.(jpe?g|png|webp)(\?|$)/i.test(url))) continue;
    seen.add(url);
    const widthMatch = tag.match(/\bwidth\s*=\s*["']?(\d+)/i);
    const heightMatch = tag.match(/\bheight\s*=\s*["']?(\d+)/i);
    candidates.push({
      dropZone: /imageDropZone|mceImage/i.test(tag),
      height: heightMatch ? Number(heightMatch[1]) : 0,
      url,
      width: widthMatch ? Number(widthMatch[1]) : 0,
    });
  }
  if (!candidates.length) return undefined;
  candidates.sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
  return candidates[0]?.url;
}

function extractOgImageUrl(html) {
  const og =
    html.match(
      /<meta\b[^>]*\bproperty\s*=\s*["']og:image["'][^>]*\bcontent\s*=\s*["']([^"']+)["'][^>]*>/i,
    ) ||
    html.match(
      /<meta\b[^>]*\bcontent\s*=\s*["']([^"']+)["'][^>]*\bproperty\s*=\s*["']og:image["'][^>]*>/i,
    );
  if (og?.[1]) return absoluteImageUrl(og[1]);
  const twitter =
    html.match(
      /<meta\b[^>]*\bname\s*=\s*["']twitter:image["'][^>]*\bcontent\s*=\s*["']([^"']+)["'][^>]*>/i,
    ) ||
    html.match(
      /<meta\b[^>]*\bcontent\s*=\s*["']([^"']+)["'][^>]*\bname\s*=\s*["']twitter:image["'][^>]*>/i,
    );
  if (twitter?.[1]) return absoluteImageUrl(twitter[1]);
  return undefined;
}

function kvGet(namespaceId) {
  const out = execFileSync(
    'pnpm',
    ['exec', 'wrangler', 'kv', 'key', 'get', 'latest', `--namespace-id=${namespaceId}`, '--remote'],
    {encoding: 'utf8', maxBuffer: 10 * 1024 * 1024},
  );
  // Wrangler may print logs to stdout; find JSON array start
  const start = out.indexOf('[');
  if (start < 0) throw new Error(`No JSON in KV get for ${namespaceId}: ${out.slice(0, 200)}`);
  return JSON.parse(out.slice(start));
}

function kvPut(namespaceId, value) {
  const dir = mkdtempSync(join(tmpdir(), 'bhe-nl-'));
  const path = join(dir, 'latest.json');
  writeFileSync(path, JSON.stringify(value));
  execFileSync(
    'pnpm',
    [
      'exec',
      'wrangler',
      'kv',
      'key',
      'put',
      'latest',
      `--namespace-id=${namespaceId}`,
      `--path=${path}`,
      '--remote',
    ],
    {encoding: 'utf8', stdio: 'inherit'},
  );
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {'user-agent': UA, accept: 'text/html,*/*'},
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`Fetch ${url} -> ${res.status}`);
  return res.text();
}

async function enrichSchool(items) {
  let withImage = 0;
  const out = [];
  for (const item of items) {
    const next = {...item};
    if (/smore\.com/i.test(item.url || '')) {
      try {
        const html = await fetchText(item.url);
        const imageUrl = extractOgImageUrl(html);
        if (imageUrl) {
          next.imageUrl = imageUrl;
          withImage += 1;
        }
      } catch (err) {
        console.warn(`school image miss ${item.id}: ${err.message}`);
      }
    }
    out.push(next);
  }
  return {items: out, withImage};
}

async function enrichPta(items) {
  let withImage = 0;
  const out = [];
  for (const item of items) {
    const next = {...item};
    const archiveUrl = `https://us8.campaign-archive.com/?u=${MAILCHIMP_U}&id=${item.id}`;
    try {
      const html = await fetchText(archiveUrl);
      const imageUrl = extractMailchimpImageUrl(html);
      if (imageUrl) {
        next.imageUrl = imageUrl;
        withImage += 1;
      }
    } catch (err) {
      console.warn(`pta image miss ${item.id}: ${err.message}`);
    }
    out.push(next);
  }
  return {items: out, withImage};
}

async function main() {
  console.log('Reading school newsletters from KV…');
  const school = kvGet(SCHOOL_KV);
  console.log(`School: ${school.length} items`);
  const schoolEnriched = await enrichSchool(school);
  console.log(`School images: ${schoolEnriched.withImage}/${school.length}`);
  kvPut(SCHOOL_KV, schoolEnriched.items);

  console.log('Reading PTA newsletters from KV…');
  const pta = kvGet(PTA_KV);
  console.log(`PTA: ${pta.length} items`);
  const ptaEnriched = await enrichPta(pta);
  console.log(`PTA images: ${ptaEnriched.withImage}/${pta.length}`);
  kvPut(PTA_KV, ptaEnriched.items);

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
