import {requireAdmin} from '~/lib/admin/auth';
import {getCloudflare} from '~/lib/cloudflare-context';
import type {Route} from './+types/api.admin.reimbursement-r2-cleanup';

const ALLOWED_PREFIXES = ['uploads/', 'submissions/'] as const;
const LIST_PAGE_SIZE = 1000;
/** R2 list calls per Worker invocation (room below default 10k subrequest budget for D1, etc.). */
const MAX_R2_LIST_OPS = 9500;

function isAllowedCleanupKey(key: string): boolean {
  if (!key || key.includes('..') || key.startsWith('/')) return false;
  return ALLOWED_PREFIXES.some((p) => key.startsWith(p));
}

async function loadReferencedKeys(db: D1Database): Promise<Set<string>> {
  const referenced = new Set<string>();
  const pdfs = await db
    .prepare('SELECT pdf_key FROM submissions WHERE pdf_key IS NOT NULL')
    .all<{pdf_key: string}>();
  for (const row of pdfs.results) {
    const k = row.pdf_key.trim();
    if (k) referenced.add(k);
  }
  const files = await db.prepare('SELECT r2_key FROM file_attachments').all<{r2_key: string}>();
  for (const row of files.results) {
    const k = row.r2_key.trim();
    if (k) referenced.add(k);
  }
  const conversionKeys = await db
    .prepare(
      `SELECT original_key AS k FROM receipt_conversion_jobs WHERE original_key IS NOT NULL
       UNION ALL
       SELECT converted_key AS k FROM receipt_conversion_jobs WHERE converted_key IS NOT NULL`,
    )
    .all<{k: string}>();
  for (const row of conversionKeys.results) {
    const k = row.k.trim();
    if (k) referenced.add(k);
  }
  return referenced;
}

async function listPrefixUntilDone(
  r2: R2Bucket,
  prefix: string,
  listOps: {count: number},
): Promise<{objects: R2Object[]; incomplete: boolean}> {
  const out: R2Object[] = [];
  let cursor: string | undefined;
  let incomplete = false;

  while (true) {
    if (listOps.count >= MAX_R2_LIST_OPS) {
      incomplete = true;
      break;
    }

    const page = await r2.list({cursor, limit: LIST_PAGE_SIZE, prefix});
    listOps.count += 1;
    out.push(...page.objects);

    if (!page.truncated) break;

    if (!page.cursor) {
      incomplete = true;
      break;
    }
    cursor = page.cursor;
  }

  return {objects: out, incomplete};
}

export async function loader({request, context}: Route.LoaderArgs) {
  const env = getCloudflare(context).env;
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const r2 = env.R2_BUCKET;
  if (!r2) {
    return Response.json({error: 'R2 storage is not configured'}, {status: 503});
  }

  const db = env.REIMBURSEMENT_DB;
  const referenced = await loadReferencedKeys(db);
  const listOps = {count: 0};
  const uploadResult = await listPrefixUntilDone(r2, 'uploads/', listOps);
  const submissionResult = await listPrefixUntilDone(r2, 'submissions/', listOps);

  const listIncomplete = uploadResult.incomplete || submissionResult.incomplete;
  const seenKeys = new Set<string>();
  const all: R2Object[] = [];
  for (const o of [...uploadResult.objects, ...submissionResult.objects]) {
    if (seenKeys.has(o.key)) continue;
    seenKeys.add(o.key);
    all.push(o);
  }

  const orphaned = all
    .filter((o) => !referenced.has(o.key))
    .map((o) => ({
      key: o.key,
      size: o.size,
      uploaded: o.uploaded ? o.uploaded.toISOString() : null,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));

  return Response.json({
    count: orphaned.length,
    listIncomplete,
    orphaned,
    ...(listIncomplete
      ? {
          listWarning:
            'Bucket listing hit a safety limit or an unexpected stop before every object was scanned. Some unused objects may be missing from this list; run again after cleanup or raise limits if your bucket is very large.',
        }
      : {}),
  });
}

export async function action({request, context}: Route.ActionArgs) {
  const env = getCloudflare(context).env;
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  if (request.method !== 'POST') {
    return Response.json({error: 'Method not allowed'}, {status: 405});
  }

  const r2 = env.R2_BUCKET;
  if (!r2) {
    return Response.json({error: 'R2 storage is not configured'}, {status: 503});
  }

  const body = (await request.json()) as {keys?: string[]};
  if (!body.keys || !Array.isArray(body.keys) || body.keys.length === 0) {
    return Response.json({error: 'No keys provided'}, {status: 400});
  }

  const db = env.REIMBURSEMENT_DB;
  const referenced = await loadReferencedKeys(db);
  const uniqueRequested = [...new Set(body.keys)];
  const toDelete = uniqueRequested.filter((k) => isAllowedCleanupKey(k) && !referenced.has(k));
  const rejected = uniqueRequested.length - toDelete.length;

  await Promise.all(toDelete.map((key) => r2.delete(key)));

  return Response.json({deleted: toDelete.length, rejected});
}
