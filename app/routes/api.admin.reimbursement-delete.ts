import {requireAdmin} from '~/lib/admin/auth';
import {getCloudflare} from '~/lib/cloudflare-context';
import type {Route} from './+types/api.admin.reimbursement-delete';

export async function action({request, params, context}: Route.ActionArgs) {
  const auth = await requireAdmin(request, getCloudflare(context).env);
  if (auth instanceof Response) return auth;

  const id = params.id;
  const db = getCloudflare(context).env.REIMBURSEMENT_DB;

  // Get the submission's pdf_key and all file attachment r2_keys
  const submission = await db
    .prepare('SELECT pdf_key FROM submissions WHERE id = ?')
    .bind(id)
    .first<{pdf_key: string | null}>();

  if (!submission) {
    return Response.json({error: 'Submission not found'}, {status: 404});
  }

  const files = await db
    .prepare('SELECT r2_key FROM file_attachments WHERE submission_id = ?')
    .bind(id)
    .all<{r2_key: string}>();

  // Delete files from R2
  const r2 = getCloudflare(context).env.R2_BUCKET;
  if (r2) {
    const keysToDelete = [submission.pdf_key, ...files.results.map((f) => f.r2_key)].filter(
      Boolean,
    ) as string[];
    await Promise.all(keysToDelete.map((key) => r2.delete(key)));
  }

  // Delete from D1 (cascades to receipt_entries and file_attachments)
  await db.prepare('DELETE FROM submissions WHERE id = ?').bind(id).run();

  return Response.json({success: true});
}
