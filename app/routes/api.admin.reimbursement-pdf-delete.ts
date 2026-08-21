import {requireAdmin} from '~/lib/admin/auth';
import {getCloudflare} from '~/lib/cloudflare-context';
import type {Route} from './+types/api.admin.reimbursement-pdf-delete';

export async function action({request, params, context}: Route.ActionArgs) {
  const env = getCloudflare(context).env;
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  if (request.method !== 'DELETE') {
    return new Response(null, {status: 405});
  }

  const submissionId = params.id;
  const db = env.REIMBURSEMENT_DB;

  const row = await db
    .prepare('SELECT pdf_key FROM submissions WHERE id = ?')
    .bind(submissionId)
    .first<{pdf_key: string | null}>();

  if (!row) {
    return Response.json({error: 'Submission not found'}, {status: 404});
  }
  if (!row.pdf_key) {
    return Response.json({error: 'No PDF on this submission'}, {status: 404});
  }

  const r2 = env.R2_BUCKET;
  if (r2) {
    await r2.delete(row.pdf_key);
  }

  await db
    .prepare(`UPDATE submissions SET pdf_key = NULL, updated_at = datetime('now') WHERE id = ?`)
    .bind(submissionId)
    .run();

  return Response.json({success: true});
}
