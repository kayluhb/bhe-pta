#!/usr/bin/env npx tsx

/**
 * Regenerate the archive manifest using WordPress DB attachment data
 * for better titles and correct school year assignments.
 *
 * Usage: npx tsx scripts/regen-manifest.ts
 *
 * Reads:
 *   - /tmp/wp-attachments.json (parsed WordPress attachment records)
 *   - Current app/data/archive.ts (to get list of R2 keys already uploaded)
 *
 * Writes:
 *   - app/data/archive.ts (regenerated manifest)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_FILE = resolve(__dirname, "../app/data/archive.ts");
const ATTACHMENTS_FILE = "/tmp/wp-attachments.json";

// ── Types ──────────────────────────────────────────────────────────────────

interface WpAttachment {
  title: string;
  date: string; // "2012-09-18 12:54:05"
  filename: string;
  guid: string;
}

interface ManifestItem {
  id: string;
  title: string;
  type: "image" | "pdf" | "document";
  r2Key: string;
  thumbnailR2Key?: string;
  date: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function toSchoolYear(year: number, month: number): string {
  if (month >= 8) return `${year}-${year + 1}`;
  return `${year - 1}-${year}`;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(name: string): string {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Parse existing manifest ─────────────────────────────────────────────────

function parseExistingManifest(): ManifestItem[] {
  const src = readFileSync(OUTPUT_FILE, "utf-8");
  const items: ManifestItem[] = [];

  // Extract items using regex — each item block between { and }
  const itemRegex =
    /\{\s*id:\s*"([^"]*)",\s*title:\s*"([^"]*)",\s*type:\s*"([^"]*)",\s*r2Key:\s*"([^"]*)",\s*(?:thumbnailR2Key:\s*"([^"]*)",\s*)?date:\s*"([^"]*)",?\s*\}/g;

  let match;
  while ((match = itemRegex.exec(src)) !== null) {
    items.push({
      id: match[1],
      title: match[2],
      type: match[3] as "image" | "pdf" | "document",
      r2Key: match[4],
      thumbnailR2Key: match[5] || undefined,
      date: match[6],
    });
  }

  return items;
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log("Loading WordPress attachment data...");
  const attachments: WpAttachment[] = JSON.parse(
    readFileSync(ATTACHMENTS_FILE, "utf-8")
  );
  console.log(`  ${attachments.length} WordPress attachments loaded`);

  // Build lookup: lowercase filename → attachment record
  // Some filenames appear multiple times; use the one with a real title
  const attachmentByFilename = new Map<string, WpAttachment>();
  for (const att of attachments) {
    const key = att.filename.toLowerCase();
    const existing = attachmentByFilename.get(key);
    // Prefer records with non-empty titles
    if (!existing || (existing.title === "" && att.title !== "")) {
      attachmentByFilename.set(key, att);
    }
  }
  console.log(`  ${attachmentByFilename.size} unique filenames`);

  console.log("\nParsing existing manifest...");
  const existingItems = parseExistingManifest();
  console.log(`  ${existingItems.length} items in current manifest`);

  // Process each item
  const processedItems: (ManifestItem & { schoolYear: string })[] = [];
  let matched = 0;
  let titleImproved = 0;
  let dateFixed = 0;

  for (const item of existingItems) {
    // Extract filename from r2Key (e.g., "2021-2022/filename.jpg" → "filename.jpg")
    const filename = item.r2Key.split("/").pop()!;
    const currentSchoolYear = item.r2Key.split("/")[0]; // e.g., "2022-2023"

    // Skip 2022-2023 (just paypal/venmo logos)
    if (currentSchoolYear === "2022-2023") {
      console.log(`  Skipping: ${filename} (original 2022-2023)`);
      continue;
    }

    // Try to match with WordPress attachment
    const wpAtt = attachmentByFilename.get(filename.toLowerCase());

    let title = item.title;
    let date = item.date;
    let schoolYear = currentSchoolYear;

    if (wpAtt) {
      matched++;

      // Use WordPress title if it's meaningful (not empty, not just a filename slug)
      if (wpAtt.title && wpAtt.title.length > 1) {
        const wpTitle = wpAtt.title.trim();
        // Only use WP title if it's not just the filename repeated
        const filenameTitle = titleCase(
          basename(filename, extname(filename))
        );
        if (wpTitle !== filenameTitle && wpTitle.length > 0) {
          title = wpTitle;
          titleImproved++;
        }
      }

      // Use WordPress date for school year calculation
      const wpDate = new Date(wpAtt.date);
      if (!isNaN(wpDate.getTime())) {
        const wpYear = wpDate.getFullYear();
        const wpMonth = wpDate.getMonth() + 1;
        const newSchoolYear = toSchoolYear(wpYear, wpMonth);
        const newDate = `${wpYear}-${String(wpMonth).padStart(2, "0")}-${String(wpDate.getDate()).padStart(2, "0")}`;

        if (newSchoolYear !== currentSchoolYear) {
          dateFixed++;
          console.log(
            `  Date fix: ${filename}: ${currentSchoolYear} → ${newSchoolYear} (WP date: ${wpAtt.date})`
          );
        }

        schoolYear = newSchoolYear;
        date = newDate;
      }
    }

    // Also skip items reassigned to 2022-2023
    if (schoolYear === "2022-2023") {
      console.log(`  Skipping: ${filename} (reassigned to 2022-2023)`);
      continue;
    }

    processedItems.push({
      id: slugify(basename(filename, extname(filename))),
      title,
      type: item.type,
      r2Key: item.r2Key, // Keep original R2 key (file is already uploaded there)
      thumbnailR2Key: item.thumbnailR2Key,
      date,
      schoolYear,
    });
  }

  console.log(`\n  Matched: ${matched}/${existingItems.length}`);
  console.log(`  Titles improved: ${titleImproved}`);
  console.log(`  School years fixed: ${dateFixed}`);
  console.log(
    `  Items after removing 2022-2023: ${processedItems.length}`
  );

  // Group by school year
  const byYear = new Map<string, typeof processedItems>();
  for (const item of processedItems) {
    const existing = byYear.get(item.schoolYear) ?? [];
    existing.push(item);
    byYear.set(item.schoolYear, existing);
  }

  // Sort years descending
  const sortedYears = [...byYear.keys()].sort((a, b) => {
    const aStart = parseInt(a.split("-")[0]);
    const bStart = parseInt(b.split("-")[0]);
    return bStart - aStart;
  });

  console.log("\n  Final breakdown:");
  for (const year of sortedYears) {
    console.log(`    ${year}: ${byYear.get(year)!.length} items`);
  }

  // Generate manifest
  const yearBlocks = sortedYears.map((year) => {
    const yearItems = byYear.get(year)!;
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
          fields.push(
            `      thumbnailR2Key: ${JSON.stringify(item.thumbnailR2Key)},`
          );
        }
        fields.push(`      date: ${JSON.stringify(item.date)},`);
        return `    {\n${fields.join("\n")}\n    }`;
      })
      .join(",\n");

    return `  {\n    year: ${JSON.stringify(year)},\n    items: [\n${itemLines},\n    ],\n  }`;
  });

  const manifest = `export interface ArchiveItem {
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
${yearBlocks.join(",\n")},
];
`;

  writeFileSync(OUTPUT_FILE, manifest, "utf-8");
  console.log(`\nWritten to ${OUTPUT_FILE}`);
  console.log("Done!");
}

main();
