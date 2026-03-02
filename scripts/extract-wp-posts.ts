#!/usr/bin/env npx tsx

/**
 * One-time script to extract published WordPress blog posts from a MySQL dump
 * and output them as a TypeScript data file for the archive page.
 *
 * Usage: npx tsx scripts/extract-wp-posts.ts
 */

import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SQL_FILE = resolve(
  process.env.HOME!,
  'Downloads/backup-2.21.2026_10-32-28_bheptaco/mysql/bheptaco_wpsite2014.sql',
);
const OUTPUT_FILE = resolve(__dirname, '../app/data/archive-posts.ts');

// ─── MySQL Value Parser ───────────────────────────────────────────────────────

/**
 * Parse a MySQL VALUES clause into rows of string values.
 * Handles escaped quotes, backslash escapes, and NULL.
 */
function parseMysqlValues(insertLine: string): string[][] {
  // Find the VALUES keyword
  const valuesIdx = insertLine.indexOf('VALUES ');
  if (valuesIdx === -1) return [];
  const valuesStr = insertLine.slice(valuesIdx + 7);

  const rows: string[][] = [];
  let i = 0;

  while (i < valuesStr.length) {
    // Find opening paren
    if (valuesStr[i] === '(') {
      i++;
      const row: string[] = [];
      while (i < valuesStr.length && valuesStr[i] !== ')') {
        // Skip whitespace
        while (i < valuesStr.length && valuesStr[i] === ' ') i++;

        if (valuesStr[i] === "'") {
          // Parse quoted string
          i++; // skip opening quote
          let val = '';
          while (i < valuesStr.length) {
            if (valuesStr[i] === '\\') {
              // Escaped character
              i++;
              if (i < valuesStr.length) {
                const esc = valuesStr[i];
                if (esc === 'n') val += '\n';
                else if (esc === 'r') val += '\r';
                else if (esc === 't') val += '\t';
                else if (esc === '0') val += '\0';
                else val += esc; // \', \\, etc.
                i++;
              }
            } else if (valuesStr[i] === "'") {
              // Check for double-quote escape ''
              if (i + 1 < valuesStr.length && valuesStr[i + 1] === "'") {
                val += "'";
                i += 2;
              } else {
                i++; // skip closing quote
                break;
              }
            } else {
              val += valuesStr[i];
              i++;
            }
          }
          row.push(val);
        } else if (
          valuesStr.slice(i, i + 4).toUpperCase() === 'NULL'
        ) {
          row.push('');
          i += 4;
        } else {
          // Numeric or other unquoted value
          let val = '';
          while (
            i < valuesStr.length &&
            valuesStr[i] !== ',' &&
            valuesStr[i] !== ')'
          ) {
            val += valuesStr[i];
            i++;
          }
          row.push(val.trim());
        }

        // Skip comma between values
        if (i < valuesStr.length && valuesStr[i] === ',') i++;
      }
      if (valuesStr[i] === ')') i++;
      rows.push(row);
    }
    i++;
  }

  return rows;
}

// ─── Extract Data ─────────────────────────────────────────────────────────────

console.log('Reading SQL dump...');
const sql = readFileSync(SQL_FILE, 'utf-8');
const lines = sql.split('\n');

// ── Parse wdwp_posts ──

interface RawPost {
  id: number;
  postDate: string;
  content: string;
  title: string;
  excerpt: string;
  postStatus: string;
  postName: string; // slug
  postParent: number;
  postType: string;
}

const posts: RawPost[] = [];

for (const line of lines) {
  if (!line.startsWith('INSERT INTO `wdwp_posts`')) continue;
  const rows = parseMysqlValues(line);
  for (const row of rows) {
    // Columns: ID, post_author, post_date, post_date_gmt, post_content, post_title,
    //          post_excerpt, post_status, comment_status, ping_status, post_password,
    //          post_name, to_ping, pinged, post_modified, post_modified_gmt,
    //          post_content_filtered, post_parent, guid, menu_order, post_type,
    //          post_mime_type, comment_count
    posts.push({
      id: Number(row[0]),
      postDate: row[2],
      content: row[4],
      title: row[5],
      excerpt: row[6],
      postStatus: row[7],
      postName: row[11],
      postParent: Number(row[17]),
      postType: row[20],
    });
  }
}

console.log(`Parsed ${posts.length} total post rows`);

// ── Parse terms and taxonomies ──

interface Term {
  termId: number;
  name: string;
  slug: string;
}

const terms: Term[] = [];
for (const line of lines) {
  if (!line.startsWith('INSERT INTO `wdwp_terms`')) continue;
  for (const row of parseMysqlValues(line)) {
    terms.push({termId: Number(row[0]), name: row[1], slug: row[2]});
  }
}

interface TermTaxonomy {
  termTaxonomyId: number;
  termId: number;
  taxonomy: string;
}

const termTaxonomies: TermTaxonomy[] = [];
for (const line of lines) {
  if (!line.startsWith('INSERT INTO `wdwp_term_taxonomy`')) continue;
  for (const row of parseMysqlValues(line)) {
    termTaxonomies.push({
      termTaxonomyId: Number(row[0]),
      termId: Number(row[1]),
      taxonomy: row[2],
    });
  }
}

interface TermRelationship {
  objectId: number;
  termTaxonomyId: number;
}

const termRelationships: TermRelationship[] = [];
for (const line of lines) {
  if (!line.startsWith('INSERT INTO `wdwp_term_relationships`')) continue;
  for (const row of parseMysqlValues(line)) {
    termRelationships.push({
      objectId: Number(row[0]),
      termTaxonomyId: Number(row[1]),
    });
  }
}

// Build lookup: term_taxonomy_id → category name (only 'category' taxonomy)
const categoryTaxIds = new Map<number, string>();
for (const tt of termTaxonomies) {
  if (tt.taxonomy === 'category') {
    const term = terms.find((t) => t.termId === tt.termId);
    if (term) categoryTaxIds.set(tt.termTaxonomyId, term.name);
  }
}

// Build lookup: post_id → category name
const postCategories = new Map<number, string>();
for (const tr of termRelationships) {
  const catName = categoryTaxIds.get(tr.termTaxonomyId);
  if (catName) {
    postCategories.set(tr.objectId, catName);
  }
}

console.log(`Found ${terms.length} terms, ${termTaxonomies.length} taxonomies, ${termRelationships.length} relationships`);

// ─── Filter & Process Posts ───────────────────────────────────────────────────

const publishedPosts = posts.filter(
  (p) => p.postType === 'post' && p.postStatus === 'publish',
);
console.log(`Found ${publishedPosts.length} published posts`);

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function stripShortcodes(html: string): string {
  // Remove [caption]...[/caption] but keep inner content
  let result = html.replace(
    /\[caption[^\]]*\]([\s\S]*?)\[\/caption\]/gi,
    '$1',
  );
  // Remove other shortcodes like [gallery], [embed], etc.
  result = result.replace(/\[\/?\w+[^\]]*\]/g, '');
  return result;
}

function htmlToExcerpt(html: string, maxLen = 200): string {
  // Strip HTML tags and decode common entities
  let text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&#8217;/gi, '\u2019')
    .replace(/&#8216;/gi, '\u2018')
    .replace(/&#8220;/gi, '\u201C')
    .replace(/&#8221;/gi, '\u201D')
    .replace(/&#8211;/gi, '\u2013')
    .replace(/&#8212;/gi, '\u2014')
    .replace(/&#8230;/gi, '\u2026')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length > maxLen) {
    text = `${text.slice(0, maxLen).replace(/\s+\S*$/, '')}\u2026`;
  }
  return text;
}

function getSchoolYear(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1; // 1-12
  const year = d.getFullYear();
  // June-December → year/year+1, January-May → year-1/year
  if (month >= 6) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

function sanitizeContent(html: string): string {
  let result = stripShortcodes(html);
  // Rewrite WordPress image URLs to R2 archive
  result = result.replace(
    /https?:\/\/bheeagles\.com\/wp-content\/uploads\//g,
    'https://archive.bheeagles.com/wp-content/uploads/',
  );
  // Decode common HTML entities for clean display
  result = result
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8216;/g, '\u2018')
    .replace(/&#8220;/g, '\u201C')
    .replace(/&#8221;/g, '\u201D')
    .replace(/&#8211;/g, '\u2013')
    .replace(/&#8212;/g, '\u2014')
    .replace(/&#8230;/g, '\u2026')
    .replace(/&nbsp;/g, ' ');
  return result.trim();
}

// ─── Build Output ─────────────────────────────────────────────────────────────

interface OutputPost {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  category?: string;
}

const yearMap = new Map<string, OutputPost[]>();

for (const p of publishedPosts) {
  const schoolYear = getSchoolYear(p.postDate);
  const content = sanitizeContent(p.content);
  const excerpt = p.excerpt.trim()
    ? htmlToExcerpt(p.excerpt)
    : htmlToExcerpt(content);

  const post: OutputPost = {
    id: p.postName || slugify(p.title),
    title: p.title
      .replace(/&#8217;/g, '\u2019')
      .replace(/&#8216;/g, '\u2018')
      .replace(/&#8220;/g, '\u201C')
      .replace(/&#8221;/g, '\u201D')
      .replace(/&#8211;/g, '\u2013')
      .replace(/&#8212;/g, '\u2014')
      .replace(/&#8230;/g, '\u2026')
      .replace(/&amp;/g, '&'),
    date: new Date(p.postDate).toISOString().split('T')[0],
    excerpt,
    content,
    ...(postCategories.has(p.id) ? {category: postCategories.get(p.id)} : {}),
  };

  if (!yearMap.has(schoolYear)) yearMap.set(schoolYear, []);
  yearMap.get(schoolYear)!.push(post);
}

// Sort posts within each year by date descending
for (const posts of yearMap.values()) {
  posts.sort((a, b) => b.date.localeCompare(a.date));
}

// Sort years descending
const sortedYears = [...yearMap.entries()].sort((a, b) =>
  b[0].localeCompare(a[0]),
);

console.log(`\nPosts by school year:`);
for (const [year, yearPosts] of sortedYears) {
  console.log(`  ${year}: ${yearPosts.length} posts`);
}

// ─── Write Output File ────────────────────────────────────────────────────────

function escapeForTemplate(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

let output = `// Auto-generated by scripts/extract-wp-posts.ts — do not edit manually

export interface ArchivePost {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  category?: string;
}

export interface ArchivePostYear {
  year: string;
  posts: ArchivePost[];
}

export const archivePostData: ArchivePostYear[] = [\n`;

for (const [year, yearPosts] of sortedYears) {
  output += `  {\n    year: '${year}',\n    posts: [\n`;
  for (const post of yearPosts) {
    output += `      {\n`;
    output += `        id: '${escapeForTemplate(post.id)}',\n`;
    output += `        title: \`${escapeForTemplate(post.title)}\`,\n`;
    output += `        date: '${post.date}',\n`;
    output += `        excerpt: \`${escapeForTemplate(post.excerpt)}\`,\n`;
    output += `        content: \`${escapeForTemplate(post.content)}\`,\n`;
    if (post.category) {
      output += `        category: '${escapeForTemplate(post.category)}',\n`;
    }
    output += `      },\n`;
  }
  output += `    ],\n  },\n`;
}

output += `];\n`;

writeFileSync(OUTPUT_FILE, output, 'utf-8');
console.log(`\nWrote ${OUTPUT_FILE}`);
