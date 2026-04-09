import {requireAdmin} from '~/lib/admin/auth';
import {sendCheckDeliveredEmail} from '~/lib/reimbursement/email/resend';
import type {Route} from './+types/api.admin.bulk-status';

const VALID_STATUSES = ['pending', 'approved', 'rejected', 'needs_info', 'check_delivered'];

export async function action({request, context}: Route.ActionArgs) {
  const auth = await requireAdmin(request, context.cloudflare.env);
  if (auth instanceof Response) return auth;

  const body = (await request.json()) as {ids?: string[]; status?: string; skipEmail?: boolean};

  if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
    return Response.json({error: 'No submissions selected'}, {status: 400});
  }

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return Response.json(
      {error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`},
      {status: 400},
    );
  }

  const db = context.cloudflare.env.REIMBURSEMENT_DB;
  const placeholders = body.ids.map(() => '?').join(', ');
  await db
    .prepare(
      `UPDATE submissions SET status = ?, updated_at = datetime('now') WHERE id IN (${placeholders})`,
    )
    .bind(body.status, ...body.ids)
    .run();

  if (body.status === 'check_delivered' && !body.skipEmail) {
    const subs = await db
      .prepare(
        `SELECT requester_name, requester_email FROM submissions WHERE id IN (${placeholders})`,
      )
      .bind(...body.ids)
      .all<{requester_name: string; requester_email: string}>();

    await Promise.allSettled(
      subs.results.map((sub) =>
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
