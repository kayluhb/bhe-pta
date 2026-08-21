import {requireAdmin} from '~/lib/admin/auth';
import {getCloudflare} from '~/lib/cloudflare-context';
import type {Route} from './+types/api.admin.reimbursement-attachment-delete';

export async function action({request, params, context}: Route.ActionArgs) {
  const auth = await requireAdmin(request, getCloudflare(context).env);
  if (auth instanceof Response) return auth;

  if (request.method !== 'DELETE') {
    return new Response(null, {status: 405});
  }

  const submissionId = params.id;
  const attachmentId = params.attachmentId;
  const db = getCloudflare(context).env.REIMBURSEMENT_DB;

  const row = await db
    .prepare('SELECT r2_key FROM file_attachments WHERE id = ? AND submission_id = ?')
    .bind(attachmentId, submissionId)
    .first<{r2_key: string}>();

  if (!row) {
    return Response.json({error: 'Attachment not found'}, {status: 404});
  }

  const r2 = getCloudflare(context).env.R2_BUCKET;
  if (r2) {
    await r2.delete(row.r2_key);
  }

  await db
    .prepare('DELETE FROM file_attachments WHERE id = ? AND submission_id = ?')
    .bind(attachmentId, submissionId)
    .run();

  await db
    .prepare(`UPDATE submissions SET updated_at = datetime('now') WHERE id = ?`)
    .bind(submissionId)
    .run();

  return Response.json({success: true});
}
