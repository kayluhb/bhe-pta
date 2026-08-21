import {requireAdmin} from '~/lib/admin/auth';
import {
  ADMIN_SUBMISSION_STATUSES,
  isAdminSubmissionStatus,
} from '~/lib/admin/reimbursement-submission-statuses';
import {getCloudflare} from '~/lib/cloudflare-context';
import {sendCheckDeliveredEmail} from '~/lib/reimbursement/email/resend';
import type {Route} from './+types/api.admin.reimbursement-status';

const SUBMISSION_STATUS_APPROVED = 'approved';
const SUBMISSION_STATUS_CHECK_DELIVERED = 'check_delivered';

export async function action({request, params, context}: Route.ActionArgs) {
  const auth = await requireAdmin(request, getCloudflare(context).env);
  if (auth instanceof Response) return auth;

  const id = params.id;
  const body = (await request.json()) as {status?: string; notes?: string; skipEmail?: boolean};

  if (!body.status || !isAdminSubmissionStatus(body.status)) {
    return Response.json(
      {error: `Invalid status. Must be one of: ${ADMIN_SUBMISSION_STATUSES.join(', ')}`},
      {status: 400},
    );
  }

  const db = getCloudflare(context).env.REIMBURSEMENT_DB;
  const result = await db
    .prepare(
      `UPDATE submissions SET
         status = ?,
         admin_notes = ?,
         date_approved = CASE
           WHEN ? = '${SUBMISSION_STATUS_APPROVED}' AND status != '${SUBMISSION_STATUS_APPROVED}' THEN date('now')
           ELSE date_approved
         END,
         updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(body.status, body.notes ?? null, body.status, id)
    .run();

  if (result.meta.changes === 0) {
    return Response.json({error: 'Submission not found'}, {status: 404});
  }

  if (body.status === SUBMISSION_STATUS_CHECK_DELIVERED && !body.skipEmail) {
    const sub = await db
      .prepare('SELECT requester_name, requester_email FROM submissions WHERE id = ?')
      .bind(id)
      .first<{requester_name: string; requester_email: string}>();

    if (sub) {
      await sendCheckDeliveredEmail({
        requesterName: sub.requester_name,
        requesterEmail: sub.requester_email,
        resendApiKey: getCloudflare(context).env.RESEND_API_KEY,
      });
    }
  }

  return Response.json({success: true});
}
