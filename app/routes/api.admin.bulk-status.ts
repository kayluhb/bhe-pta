import {requireAdmin} from '~/lib/admin/auth';
import {
  ADMIN_SUBMISSION_STATUSES,
  isAdminSubmissionStatus,
} from '~/lib/admin/reimbursement-submission-statuses';
import {sendCheckDeliveredEmail} from '~/lib/reimbursement/email/resend';
import type {Route} from './+types/api.admin.bulk-status';

/** SQL CASE / UI branch alignment with `submissions.status` values. */
const SUBMISSION_STATUS_APPROVED = 'approved';
const SUBMISSION_STATUS_CHECK_DELIVERED = 'check_delivered';

export async function action({request, context}: Route.ActionArgs) {
  const auth = await requireAdmin(request, context.cloudflare.env);
  if (auth instanceof Response) return auth;

  const body = (await request.json()) as {ids?: string[]; status?: string; skipEmail?: boolean};

  if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
    return Response.json({error: 'No submissions selected'}, {status: 400});
  }

  if (!body.status || !isAdminSubmissionStatus(body.status)) {
    return Response.json(
      {error: `Invalid status. Must be one of: ${ADMIN_SUBMISSION_STATUSES.join(', ')}`},
      {status: 400},
    );
  }

  const db = context.cloudflare.env.REIMBURSEMENT_DB;
  const placeholders = body.ids.map(() => '?').join(', ');
  await db
    .prepare(
      `UPDATE submissions SET
         status = ?,
         date_approved = CASE
           WHEN ? = '${SUBMISSION_STATUS_APPROVED}' AND status != '${SUBMISSION_STATUS_APPROVED}' THEN date('now')
           ELSE date_approved
         END,
         updated_at = datetime('now')
       WHERE id IN (${placeholders})`,
    )
    .bind(body.status, body.status, ...body.ids)
    .run();

  if (body.status === SUBMISSION_STATUS_CHECK_DELIVERED && !body.skipEmail) {
    const subs = await db
      .prepare(
        `SELECT requester_name, requester_email FROM submissions WHERE id IN (${placeholders})`,
      )
      .bind(...body.ids)
      .all<{requester_name: string; requester_email: string}>();

    const uniqueRecipients = new Map<string, {requester_name: string; requester_email: string}>();
    for (const sub of subs.results) {
      const normalizedEmail = sub.requester_email.trim().toLowerCase();
      if (!uniqueRecipients.has(normalizedEmail)) {
        uniqueRecipients.set(normalizedEmail, sub);
      }
    }

    await Promise.allSettled(
      Array.from(uniqueRecipients.values()).map((sub) =>
        sendCheckDeliveredEmail({
          requesterName: sub.requester_name,
          requesterEmail: sub.requester_email,
          resendApiKey: context.cloudflare.env.RESEND_API_KEY,
        }),
      ),
    );
  }

  return Response.json({success: true, updated: body.ids.length});
}
