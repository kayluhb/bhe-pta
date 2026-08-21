import {requireAdmin} from '~/lib/admin/auth';
import {getCloudflare} from '~/lib/cloudflare-context';
import type {Route} from './+types/api.admin.reimbursement-receipt-delete';

export async function action({request, params, context}: Route.ActionArgs) {
  const auth = await requireAdmin(request, getCloudflare(context).env);
  if (auth instanceof Response) return auth;

  if (request.method !== 'DELETE') {
    return new Response(null, {status: 405});
  }

  const submissionId = params.id;
  const receiptId = params.receiptId;
  const db = getCloudflare(context).env.REIMBURSEMENT_DB;

  const deleteResult = await db
    .prepare('DELETE FROM receipt_entries WHERE id = ? AND submission_id = ?')
    .bind(receiptId, submissionId)
    .run();

  if (deleteResult.meta.changes === 0) {
    return Response.json({error: 'Line item not found'}, {status: 404});
  }

  await db
    .prepare(
      `UPDATE submissions
       SET total_amount = (
         SELECT COALESCE(SUM(amount), 0) FROM receipt_entries WHERE submission_id = ?
       ),
       updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(submissionId, submissionId)
    .run();

  return Response.json({success: true});
}
