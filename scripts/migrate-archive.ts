#!/usr/bin/env npx tsx

import {execSync} from 'node:child_process';
import {existsSync, readdirSync, type Stats, statSync, writeFileSync} from 'node:fs';
import {basename, dirname, extname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Configuration ─────────────────────────────────────────────────────────

const homeDir = process.env.HOME;
if (!homeDir) {
  throw new Error('HOME must be set to locate the WordPress backup directory.');
}
const BACKUP_ROOT = resolve(
  homeDir,
  'Downloads/backup-2.21.2026_10-32-28_bheptaco/homedir/public_html/wp-content',
);
const UPLOADS_DIR = join(BACKUP_ROOT, 'uploads');
const GALLERY_DIR = join(BACKUP_ROOT, 'gallery');
const OUTPUT_FILE = resolve(__dirname, '../app/data/archive.ts');
const R2_PREFIX = '';
const DRY_RUN = process.argv.includes('--dry-run');

// Years to scan (school content years)
const MIN_YEAR = 2009;
const MAX_YEAR = 2022;

// ─── Skip lists ────────────────────────────────────────────────────────────

const _SKIP_EXTENSIONS = new Set([
  '.php',
  '.txt',
  '.css',
  '.js',
  '.htaccess',
  '.lock',
  '.ds_store',
  '.log',
  '.html',
  '.htm',
  '.xml',
  '.json',
  '.sql',
  '.map',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.svg',
  '.ico',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.docx', '.mp4']);

const _SKIP_DIRS = new Set(['pb_backupbuddy', 'backupbuddy_backups', 'wpsc', 'eshop_files']);

const STOCK_KEYWORDS = [
  'accomplishment',
  'achievement',
  'shutterstock',
  'stock',
  'depositphotos',
  'istock',
  'getty',
];

// Thumbnail pattern: filename-{N}x{N}.ext
const THUMBNAIL_RE = /-\d+x\d+\./;

// ─── Types ─────────────────────────────────────────────────────────────────

interface FileEntry {
  sourcePath: string;
  filename: string;
  ext: string;
  calendarYear: number;
  calendarMonth: number;
  schoolYear: string;
  sizeBytes: number;
}

interface UploadedItem {
  id: string;
  title: string;
  type: 'image' | 'pdf' | 'document';
  r2Key: string;
  thumbnailR2Key?: string;
  date: string;
  schoolYear: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function toSchoolYear(year: number, month: number): string {
  // Aug-Dec = year-year+1, Jan-Jul = (year-1)-year
  if (month >= 8) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleCase(name: string): string {
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function mimeType(ext: string): string {
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.mp4': 'video/mp4',
  };
  return map[ext.toLowerCase()] ?? 'application/octet-stream';
}

function isStockPhoto(filename: string): boolean {
  const lower = filename.toLowerCase();
  return STOCK_KEYWORDS.some((kw) => lower.includes(kw));
}

function findBestThumbnail(dir: string, baseName: string, ext: string): string | null {
  // Look for -300x200 first, then -300x{N}, then any -NxN variant that's small
  try {
    const files = readdirSync(dir);
    const prefix = baseName;

    // Prioritized thumbnail patterns
    const candidates = files
      .filter((f) => {
        if (!f.startsWith(`${prefix}-`)) return false;
        if (!f.endsWith(ext)) return false;
        return THUMBNAIL_RE.test(f);
      })
      .map((f) => {
        const match = f.match(/-(\d+)x(\d+)\./);
        if (!match) return null;
        return {file: f, w: Number.parseInt(match[1], 10), h: Number.parseInt(match[2], 10)};
      })
      .filter(Boolean) as {file: string; w: number; h: number}[];

    if (candidates.length === 0) return null;

    // Prefer ~300px wide thumbnails
    candidates.sort((a, b) => {
      const aDist = Math.abs(a.w - 300);
      const bDist = Math.abs(b.w - 300);
      return aDist - bDist;
    });

    return join(dir, candidates[0].file);
  } catch {
    return null;
  }
}

// ─── Phase A: Scan & Classify ──────────────────────────────────────────────

function scanUploads(): FileEntry[] {
  const entries: FileEntry[] = [];

  for (let year = MIN_YEAR; year <= MAX_YEAR; year++) {
    const yearDir = join(UPLOADS_DIR, String(year));
    if (!existsSync(yearDir)) continue;

    let months: string[];
    try {
      months = readdirSync(yearDir);
    } catch {
      continue;
    }

    for (const monthStr of months) {
      const monthDir = join(yearDir, monthStr);
      const month = Number.parseInt(monthStr, 10);
      if (Number.isNaN(month)) continue;

      let stat: Stats;
      try {
        stat = statSync(monthDir);
      } catch {
        continue;
      }
      if (!stat.isDirectory()) continue;

      let files: string[];
      try {
        files = readdirSync(monthDir);
      } catch {
        continue;
      }

      for (const file of files) {
        const ext = extname(file).toLowerCase();

        // Skip non-allowed extensions
        if (!ALLOWED_EXTENSIONS.has(ext)) continue;

        // Skip thumbnails
        if (THUMBNAIL_RE.test(file)) continue;

        // Skip stock photos
        if (isStockPhoto(file)) continue;

        const filePath = join(monthDir, file);
        let fileStat: Stats;
        try {
          fileStat = statSync(filePath);
        } catch {
          continue;
        }
        if (!fileStat.isFile()) continue;

        entries.push({
          sourcePath: filePath,
          filename: file,
          ext,
          calendarYear: year,
          calendarMonth: month,
          schoolYear: toSchoolYear(year, month),
          sizeBytes: fileStat.size,
        });
      }
    }
  }

  return entries;
}

function scanCakeGallery(): FileEntry[] {
  const entries: FileEntry[] = [];
  const cakesDir = join(GALLERY_DIR, 'cakes');

  if (!existsSync(cakesDir)) return entries;

  let files: string[];
  try {
    files = readdirSync(cakesDir);
  } catch {
    return entries;
  }

  for (const file of files) {
    if (file === 'thumbs') continue;
    const ext = extname(file).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) continue;
    if (THUMBNAIL_RE.test(file)) continue;

    const filePath = join(cakesDir, file);
    let fileStat: Stats;
    try {
      fileStat = statSync(filePath);
    } catch {
      continue;
    }
    if (!fileStat.isFile()) continue;

    // Carnival cakes - no date info, assign to a generic school year
    // The gallery doesn't have date metadata, so we'll use a fixed year
    entries.push({
      sourcePath: filePath,
      filename: file,
      ext,
      calendarYear: 2012, // approximate era for these carnival cakes
      calendarMonth: 4, // spring carnival
      schoolYear: '2011-2012',
      sizeBytes: fileStat.size,
    });
  }

  return entries;
}

// ─── Phase B: Upload to R2 ─────────────────────────────────────────────────

function uploadToR2(sourcePath: string, r2Key: string, contentType: string): boolean {
  try {
    execSync(
      `wrangler r2 object put "pta-archive/${r2Key}" --file="${sourcePath}" --content-type="${contentType}" --remote`,
      {stdio: 'pipe', timeout: 30000},
    );
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ Failed to upload ${r2Key}: ${msg}`);
    return false;
  }
}

// ─── Phase C: Generate Manifest ────────────────────────────────────────────

function generateManifest(items: UploadedItem[]): string {
  // Group by school year
  const byYear = new Map<string, UploadedItem[]>();
  for (const item of items) {
    const existing = byYear.get(item.schoolYear) ?? [];
    existing.push(item);
    byYear.set(item.schoolYear, existing);
  }

  // Sort years descending
  const sortedYears = [...byYear.keys()].sort((a, b) => {
    const aStart = Number.parseInt(a.split('-')[0], 10);
    const bStart = Number.parseInt(b.split('-')[0], 10);
    return bStart - aStart;
  });

  const yearBlocks = sortedYears.map((year) => {
    const yearItems = byYear.get(year) ?? [];
    // Sort items by date descending
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

// ─── Main ──────────────────────────────────────────────────────────────────

function main() {
  console.log('🗂️  Archive Migration Script');
  console.log(`   Backup root: ${BACKUP_ROOT}`);
  console.log(`   Dry run: ${DRY_RUN}`);
  console.log('');

  // Phase A: Scan
  console.log('Phase A: Scanning files...');
  const uploadEntries = scanUploads();
  const cakeEntries = scanCakeGallery();
  const allEntries = [...uploadEntries, ...cakeEntries];

  console.log(`  Found ${uploadEntries.length} files in uploads/`);
  console.log(`  Found ${cakeEntries.length} files in gallery/cakes/`);
  console.log(`  Total: ${allEntries.length} files`);

  // Stats by school year
  const bySchoolYear = new Map<string, FileEntry[]>();
  for (const entry of allEntries) {
    const existing = bySchoolYear.get(entry.schoolYear) ?? [];
    existing.push(entry);
    bySchoolYear.set(entry.schoolYear, existing);
  }

  const sortedYears = [...bySchoolYear.keys()].sort((a, b) => {
    const aStart = Number.parseInt(a.split('-')[0], 10);
    const bStart = Number.parseInt(b.split('-')[0], 10);
    return bStart - aStart;
  });

  console.log('\n  Breakdown by school year:');
  let totalSize = 0;
  for (const year of sortedYears) {
    const entries = bySchoolYear.get(year) ?? [];
    const yearSize = entries.reduce((sum, e) => sum + e.sizeBytes, 0);
    totalSize += yearSize;
    console.log(`    ${year}: ${entries.length} files (${(yearSize / 1024 / 1024).toFixed(1)} MB)`);
  }
  console.log(`\n  Total size: ${(totalSize / 1024 / 1024).toFixed(1)} MB`);

  if (DRY_RUN) {
    console.log('\n  Full file list:');
    for (const entry of allEntries) {
      console.log(`    ${entry.schoolYear} | ${entry.filename}`);
    }
    console.log('\n✅ Dry run complete. No uploads or manifest changes.');
    return;
  }

  // Phase B: Upload to R2
  console.log('\nPhase B: Uploading to R2...');

  // Track used filenames per school year for deduplication
  const usedNames = new Map<string, Set<string>>();
  const uploadedItems: UploadedItem[] = [];
  let uploaded = 0;
  let failed = 0;

  for (const entry of allEntries) {
    const yearNames = usedNames.get(entry.schoolYear) ?? new Set();
    usedNames.set(entry.schoolYear, yearNames);

    // Deduplicate filename within school year
    let finalName = entry.filename;
    const nameBase = basename(finalName, entry.ext);
    let counter = 1;
    while (yearNames.has(finalName.toLowerCase())) {
      counter++;
      finalName = `${nameBase}-${counter}${entry.ext}`;
    }
    yearNames.add(finalName.toLowerCase());

    const r2Key = R2_PREFIX
      ? `${R2_PREFIX}/${entry.schoolYear}/${finalName}`
      : `${entry.schoolYear}/${finalName}`;
    const contentType = mimeType(entry.ext);

    process.stdout.write(
      `  [${uploaded + failed + 1}/${allEntries.length}] ${entry.schoolYear}/${finalName}...`,
    );

    const success = uploadToR2(entry.sourcePath, r2Key, contentType);

    if (success) {
      uploaded++;
      process.stdout.write(' ✓\n');
    } else {
      failed++;
      process.stdout.write(' ✗\n');
      continue;
    }

    // Upload thumbnail if available
    let thumbnailR2Key: string | undefined;
    const isImage = ['.jpg', '.jpeg', '.png', '.gif'].includes(entry.ext);

    if (isImage) {
      const dir = join(entry.sourcePath, '..');
      const nameWithoutExt = basename(entry.filename, entry.ext);

      // Check for cake gallery thumbs
      const isCakeGallery = entry.sourcePath.includes('gallery/cakes');
      let thumbPath: string | null = null;

      if (isCakeGallery) {
        const cakeThumb = join(GALLERY_DIR, 'cakes', 'thumbs', `thumbs_${entry.filename}`);
        if (existsSync(cakeThumb)) {
          thumbPath = cakeThumb;
        }
      } else {
        thumbPath = findBestThumbnail(dir, nameWithoutExt, entry.ext);
      }

      if (thumbPath) {
        const thumbR2Key = R2_PREFIX
          ? `${R2_PREFIX}/${entry.schoolYear}/thumbs/${finalName}`
          : `${entry.schoolYear}/thumbs/${finalName}`;
        const thumbSuccess = uploadToR2(thumbPath, thumbR2Key, contentType);
        if (thumbSuccess) {
          thumbnailR2Key = thumbR2Key;
        }
      }
    }

    // Build item for manifest
    const nameForTitle = basename(finalName, entry.ext);
    const month = String(entry.calendarMonth).padStart(2, '0');
    const dateStr = `${entry.calendarYear}-${month}-01`;

    let itemType: 'image' | 'pdf' | 'document';
    if (entry.ext === '.pdf') {
      itemType = 'pdf';
    } else if (entry.ext === '.docx') {
      itemType = 'document';
    } else {
      itemType = 'image';
    }

    uploadedItems.push({
      id: slugify(nameForTitle),
      title: titleCase(nameForTitle),
      type: itemType,
      r2Key,
      thumbnailR2Key,
      date: dateStr,
      schoolYear: entry.schoolYear,
    });
  }

  console.log(`\n  Uploaded: ${uploaded}, Failed: ${failed}`);

  // Phase C: Generate manifest
  console.log('\nPhase C: Generating manifest...');
  const manifest = generateManifest(uploadedItems);
  writeFileSync(OUTPUT_FILE, manifest, 'utf-8');
  console.log(`  Written to ${OUTPUT_FILE}`);
  console.log(`  ${uploadedItems.length} items across ${sortedYears.length} school years`);

  console.log('\n✅ Migration complete!');
}

main();
