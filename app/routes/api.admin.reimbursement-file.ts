import {requireAdmin} from '~/lib/admin/auth';
import {getCloudflare} from '~/lib/cloudflare-context';
import {downloadFilenameForR2Object} from '~/lib/reimbursement/filename';
import type {Route} from './+types/api.admin.reimbursement-file';

export async function loader({request, context}: Route.LoaderArgs) {
  const auth = await requireAdmin(request, getCloudflare(context).env);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!key) {
    return Response.json({error: 'Missing key parameter'}, {status: 400});
  }

  const r2 = getCloudflare(context).env.R2_BUCKET;
  const object = await r2.get(key);

  if (!object) {
    return Response.json({error: 'File not found'}, {status: 404});
  }

  let storedOriginalFilename: string | null = null;
  const db = getCloudflare(context).env.REIMBURSEMENT_DB;
  if (db) {
    const attachment = await db
      .prepare('SELECT original_filename FROM file_attachments WHERE r2_key = ? LIMIT 1')
      .bind(key)
      .first<{original_filename: string}>();
    storedOriginalFilename = attachment?.original_filename ?? null;
  }

  const filename = downloadFilenameForR2Object(key, storedOriginalFilename);
  const forceDownload =
    url.searchParams.get('download') === '1' || url.searchParams.get('attachment') === '1';
  const disposition = forceDownload ? 'attachment' : 'inline';

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Content-Disposition': `${disposition}; filename="${filename}"`,
    },
  });
}
