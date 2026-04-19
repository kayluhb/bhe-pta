#!/usr/bin/env npx tsx

/**
 * Upload WordPress post images from the cPanel backup to R2.
 * Reads the list of image paths, uploads each one via wrangler.
 */

import {execSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const homeDir = process.env.HOME;
if (!homeDir) {
  throw new Error('HOME must be set to locate the WordPress uploads backup.');
}
const UPLOADS_DIR = resolve(
  homeDir,
  'Downloads/backup-2.21.2026_10-32-28_bheptaco/homedir/public_html/wp-content/uploads',
);
const BUCKET = 'pta-archive';
const R2_PREFIX = 'wp-content/uploads';

const paths = readFileSync('/tmp/upload-list2.txt', 'utf-8').trim().split('\n').filter(Boolean);

console.log(`Uploading ${paths.length} files to R2...`);

let uploaded = 0;
let failed = 0;

for (const path of paths) {
  const localFile = resolve(UPLOADS_DIR, path);
  if (!existsSync(localFile)) {
    console.log(`SKIP (not found): ${path}`);
    failed++;
    continue;
  }

  const r2Key = `${R2_PREFIX}/${path}`;
  try {
    execSync(`npx wrangler r2 object put "${BUCKET}/${r2Key}" --file "${localFile}" --remote`, {
      stdio: 'pipe',
      timeout: 30000,
    });
    uploaded++;
    if (uploaded % 20 === 0) {
      console.log(`  Progress: ${uploaded}/${paths.length}`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message?.slice(0, 100) : String(err);
    console.log(`FAILED: ${path} — ${msg}`);
    failed++;
  }
}

console.log(`\nDone. Uploaded: ${uploaded}, Failed: ${failed}`);
