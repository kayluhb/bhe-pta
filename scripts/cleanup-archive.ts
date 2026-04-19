#!/usr/bin/env npx tsx

/**
 * Clean up the archive: remove junk from R2 and regenerate the manifest.
 *
 * Usage:
 *   npx tsx scripts/cleanup-archive.ts --dry-run   # preview what would be removed
 *   npx tsx scripts/cleanup-archive.ts              # actually delete + regenerate
 */

import {execSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';
import {basename, dirname, extname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MANIFEST_FILE = resolve(__dirname, '../app/data/archive.ts');
const DRY_RUN = process.argv.includes('--dry-run');

// ── Types ──────────────────────────────────────────────────────────────────

interface ManifestItem {
  id: string;
  title: string;
  type: 'image' | 'pdf' | 'document';
  r2Key: string;
  thumbnailR2Key?: string;
  date: string;
  schoolYear: string;
}

// ── Parse existing manifest ─────────────────────────────────────────────────

function parseManifest(): ManifestItem[] {
  const src = readFileSync(MANIFEST_FILE, 'utf-8');
  const items: ManifestItem[] = [];

  // Match year sections to get schoolYear context
  const yearSectionRe = /year:\s*"([^"]+)",\s*\n\s*items:\s*\[([\s\S]*?)\],\s*\n\s*\}/g;
  let yearMatch: RegExpExecArray | null = yearSectionRe.exec(src);
  while (yearMatch !== null) {
    const schoolYear = yearMatch[1];
    const itemsBlock = yearMatch[2];

    const itemRe =
      /\{\s*id:\s*"([^"]*)",\s*title:\s*"([^"]*)",\s*type:\s*"([^"]*)",\s*r2Key:\s*"([^"]*)",\s*(?:thumbnailR2Key:\s*"([^"]*)",\s*)?date:\s*"([^"]*)",?\s*\}/g;
    let itemMatch: RegExpExecArray | null = itemRe.exec(itemsBlock);
    while (itemMatch !== null) {
      items.push({
        id: itemMatch[1],
        title: itemMatch[2],
        type: itemMatch[3] as 'image' | 'pdf' | 'document',
        r2Key: itemMatch[4],
        thumbnailR2Key: itemMatch[5] || undefined,
        date: itemMatch[6],
        schoolYear,
      });
      itemMatch = itemRe.exec(itemsBlock);
    }
    yearMatch = yearSectionRe.exec(src);
  }

  return items;
}

// ── Junk detection rules ────────────────────────────────────────────────────

// Pure hex hash filenames (must contain letters, not just digits)
const HASH_RE = /^[0-9a-f]{16,}$/i;
function isHexHash(s: string): boolean {
  return HASH_RE.test(s) && /[a-f]/i.test(s);
}
// WordPress timestamp suffix like E1636507773270
const WP_TIMESTAMP_SUFFIX_RE = /E\d{13,}$/;
// Pexels/unsplash stock
const STOCK_RE = /pexels|unsplash|annie-spratt|ed-robertson|md-duran/i;

const JUNK_TITLES_EXACT = new Set([
  'cc',
  'them',
  'unnamed',
  'image',
  'photo',
  'logo',
  'LOGO',
  'email',
  'website',
  'Cleardot',
  'fake-background',
  'facebook',
  'Facebook Circle',
  'Download on Google Play',
  'Download on the App Store',
  'Amazon Smile 2',
  'Amazon Smile',
  'mask',
  'sandwich',
  'Socks',
  'Poker',
  'Peppers',
]);

// Items with "here"/"Click here" titles — these are real docs with bad WP titles.
// We fix their titles from the filename instead of removing them.
const BAD_TITLE_FIX = new Set(['here', 'Click here']);

// Clip art / decorative images with no community value
const CLIP_ART_KEYWORDS = [
  'pineapple with sunglasses',
  'heart hands',
  'paint brushes',
  'gift box',
  'love hands',
  'alarm clock',
  'popsicles',
  'coffee and kleenex',
  'raking leaves',
  'hawaiian shirt',
  'red ridinghood',
  'medieval dragon',
  'bouncy house clip',
  'clip art',
  'clipart',
];

// UI/navigation artifacts
const UI_KEYWORDS = [
  'app store',
  'google play',
  'amazon smile',
  'cleardot',
  'fake-background',
  'facebook circle',
  'fb-icon',
  'fb_icon',
  'instagram-icon',
  'twitter-icon',
];

function isJunk(item: ManifestItem): {junk: boolean; reason: string} {
  const title = item.title;
  const titleLower = title.toLowerCase();
  const fileBase = basename(item.r2Key, extname(item.r2Key)).toLowerCase();

  // 1. Hash filenames (hex strings with letters, not just numbers)
  if (isHexHash(fileBase)) {
    return {junk: true, reason: 'hash filename'};
  }

  // 2. WordPress auto-generated timestamp duplicates
  if (WP_TIMESTAMP_SUFFIX_RE.test(fileBase)) {
    return {junk: true, reason: 'WP timestamp duplicate'};
  }

  // 3. Stock photos
  if (STOCK_RE.test(fileBase) || STOCK_RE.test(title)) {
    return {junk: true, reason: 'stock photo'};
  }

  // 4. Exact junk title matches
  if (JUNK_TITLES_EXACT.has(title)) {
    return {junk: true, reason: `junk title: "${title}"`};
  }

  // 5. Thermometer progress GIFs
  if (fileBase.startsWith('thermometer')) {
    return {junk: true, reason: 'thermometer progress gif'};
  }

  // 6. PDF thumbnail images (image type but title ends with "Pdf" or filename has _pdf)
  if (item.type === 'image' && /pdf$/i.test(title.replace(/\s+/g, ''))) {
    return {junk: true, reason: 'PDF thumbnail image'};
  }

  // 7. Clip art keywords
  for (const kw of CLIP_ART_KEYWORDS) {
    if (titleLower.includes(kw)) {
      return {junk: true, reason: `clip art: "${kw}"`};
    }
  }

  // 8. UI/navigation artifacts
  for (const kw of UI_KEYWORDS) {
    if (titleLower.includes(kw) || fileBase.includes(kw.replace(/\s+/g, '-'))) {
      return {junk: true, reason: `UI artifact: "${kw}"`};
    }
  }

  // 9. Single-character or very short meaningless titles (1-2 chars)
  if (title.length <= 2 && item.type === 'image') {
    return {junk: true, reason: `too-short title: "${title}"`};
  }

  // 10. Numeric-only IDs with no meaning (images only — PDFs/docs may be real content)
  if (/^\d+$/.test(fileBase) && item.type === 'image') {
    return {junk: true, reason: 'numeric-only filename'};
  }

  // 12. Sponsor/business logos (images in sponsor-heavy contexts)
  // Be conservative here — only flag obvious ones
  if (isSponsorLogo(item)) {
    return {junk: true, reason: 'sponsor logo'};
  }

  return {junk: false, reason: ''};
}

// Detect sponsor logos by common patterns
function isSponsorLogo(item: ManifestItem): boolean {
  if (item.type !== 'image') return false;

  const titleLower = item.title.toLowerCase();
  const fileBase = basename(item.r2Key, extname(item.r2Key)).toLowerCase();

  // Known sponsor/business image patterns from the 2013-2014 era
  // These are MM_ prefix files (carnival sponsor logos)
  if (fileBase.startsWith('mm_')) return true;

  // Files that are clearly business logos based on title
  const businessLogoPatterns = [
    // Specific businesses identified in analysis
    'waterloo',
    'brightwatch',
    'pinthouse',
    'elm restaurant',
    'endeavor acadmics',
    'stinson moyle',
    'outside voice',
    'traveling photo booth',
    'whole earth',
    'rk group',
    'smile 360',
    'south austin therapy',
    'spyglass',
    'wells',
    'west holistic',
    'westlake anesthesia',
    'realty austin',
    'davis agency',
    'design trait',
    'easy tiger logo',
    'mpa',
    'aci consulting',
    'pinnery',
    'loot rental',
    'loot finer',
    'barton hills mortgage',
    'elm-restaurant',
    'peoplesrx',
    'supersmiles',
    'tourwick',
    'the abgb',
    'the davis agency',
    'austin city dental',
    'artgarage',
    'kw logo',
    'wf logo',
  ];

  for (const pattern of businessLogoPatterns) {
    if (titleLower.includes(pattern) || fileBase.includes(pattern.replace(/\s+/g, '-'))) {
      return true;
    }
  }

  return false;
}

// ── R2 deletion ─────────────────────────────────────────────────────────────

function deleteFromR2(r2Key: string): boolean {
  try {
    execSync(`wrangler r2 object delete "pta-archive/${r2Key}" --remote`, {
      stdio: 'pipe',
      timeout: 15000,
    });
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ Failed to delete ${r2Key}: ${msg}`);
    return false;
  }
}

// ── Manifest generation ─────────────────────────────────────────────────────

function generateManifest(items: ManifestItem[]): string {
  const byYear = new Map<string, ManifestItem[]>();
  for (const item of items) {
    const existing = byYear.get(item.schoolYear) ?? [];
    existing.push(item);
    byYear.set(item.schoolYear, existing);
  }

  const sortedYears = [...byYear.keys()].sort((a, b) => {
    const aStart = Number.parseInt(a.split('-')[0], 10);
    const bStart = Number.parseInt(b.split('-')[0], 10);
    return bStart - aStart;
  });

  const yearBlocks = sortedYears.map((year) => {
    const yearItems = byYear.get(year) ?? [];
    yearItems.sort((a, b) => b.date.localeCompare(a.date));

    const itemLines = yearItems
      .map((item) => {
        const fields = [
          `      id: ${JSON.stringify(item.id)},`,
          `      title: ${JSON.stringify(item.title)},`,
          `      type: ${JSON.stringify(item.type)},`,
          `      r2Key: ${JSON.stringify(item.r2Key)},`,
        ];
        if (item.thumbnailR2Key) {
          fields.push(`      thumbnailR2Key: ${JSON.stringify(item.thumbnailR2Key)},`);
        }
        fields.push(`      date: ${JSON.stringify(item.date)},`);
        return `    {\n${fields.join('\n')}\n    }`;
      })
      .join(',\n');

    return `  {\n    year: ${JSON.stringify(year)},\n    items: [\n${itemLines},\n    ],\n  }`;
  });

  return `export interface ArchiveItem {
  id: string;
  title: string;
  description?: string;
  type: "image" | "pdf" | "document";
  r2Key: string;
  thumbnailR2Key?: string;
  date?: string;
}

export interface ArchiveYear {
  year: string;
  description?: string;
  items: ArchiveItem[];
}

export const archiveData: ArchiveYear[] = [
${yearBlocks.join(',\n')},
];
`;
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log(`Archive Cleanup ${DRY_RUN ? '(DRY RUN)' : ''}`);
  console.log('');

  const items = parseManifest();
  console.log(`Parsed ${items.length} items from manifest\n`);

  // Fix bad titles before classification
  let titlesFixed = 0;
  for (const item of items) {
    if (BAD_TITLE_FIX.has(item.title)) {
      // Derive title from filename instead
      const fb = basename(item.r2Key, extname(item.r2Key));
      const newTitle = fb
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());
      console.log(`  Title fix: "${item.title}" → "${newTitle}" (${item.r2Key})`);
      item.title = newTitle;
      item.id = fb
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      titlesFixed++;
    }
  }
  if (titlesFixed > 0) console.log(`  Fixed ${titlesFixed} bad titles\n`);

  const keep: ManifestItem[] = [];
  const remove: {item: ManifestItem; reason: string}[] = [];

  for (const item of items) {
    const {junk, reason} = isJunk(item);
    if (junk) {
      remove.push({item, reason});
    } else {
      keep.push(item);
    }
  }

  // Summary by reason
  const reasonCounts = new Map<string, number>();
  for (const {reason} of remove) {
    const bucket = reason.split(':')[0].trim();
    reasonCounts.set(bucket, (reasonCounts.get(bucket) ?? 0) + 1);
  }

  console.log('Removal breakdown:');
  for (const [reason, count] of [...reasonCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${reason}: ${count}`);
  }

  console.log(`\nKeeping: ${keep.length}`);
  console.log(`Removing: ${remove.length}`);

  // Per-year summary
  const keepByYear = new Map<string, number>();
  const removeByYear = new Map<string, number>();
  for (const item of keep) {
    keepByYear.set(item.schoolYear, (keepByYear.get(item.schoolYear) ?? 0) + 1);
  }
  for (const {item} of remove) {
    removeByYear.set(item.schoolYear, (removeByYear.get(item.schoolYear) ?? 0) + 1);
  }

  console.log('\nPer-year:');
  const allYears = new Set([...keepByYear.keys(), ...removeByYear.keys()]);
  for (const year of [...allYears].sort().reverse()) {
    const k = keepByYear.get(year) ?? 0;
    const r = removeByYear.get(year) ?? 0;
    console.log(`  ${year}: keep ${k}, remove ${r}`);
  }

  if (DRY_RUN) {
    console.log('\nFull removal list:');
    for (const {item, reason} of remove) {
      console.log(`  [${reason}] ${item.r2Key} — "${item.title}"`);
    }
    console.log('\n✅ Dry run complete. No changes made.');
    return;
  }

  // Delete from R2
  console.log('\nDeleting from R2...');
  let deleted = 0;
  let failedDeletes = 0;

  for (let i = 0; i < remove.length; i++) {
    const {item} = remove[i];
    process.stdout.write(`  [${i + 1}/${remove.length}] ${item.r2Key}...`);

    const ok = deleteFromR2(item.r2Key);
    if (ok) {
      deleted++;
      process.stdout.write(' ✓\n');
    } else {
      failedDeletes++;
      process.stdout.write(' ✗\n');
    }

    // Also delete thumbnail if present
    if (item.thumbnailR2Key) {
      deleteFromR2(item.thumbnailR2Key);
    }
  }

  console.log(`\nDeleted: ${deleted}, Failed: ${failedDeletes}`);

  // Regenerate manifest
  console.log('\nRegenerating manifest...');
  const manifest = generateManifest(keep);
  writeFileSync(MANIFEST_FILE, manifest, 'utf-8');
  console.log(`Written ${keep.length} items to ${MANIFEST_FILE}`);
  console.log('\n✅ Cleanup complete!');
}

main();
