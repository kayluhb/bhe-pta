import {requireAdmin} from '~/lib/admin/auth';
import {formatUsd} from '~/lib/format-currency';
import {sendCashCheckNudgeEmail} from '~/lib/reimbursement/email/resend';
import type {Route} from './+types/api.admin.reimbursement-cash-check-nudge';

export async function action({request, params, context}: Route.ActionArgs) {
  const auth = await requireAdmin(request, context.cloudflare.env);
  if (auth instanceof Response) return auth;

  if (request.method !== 'POST') {
    return new Response(null, {status: 405});
  }

  const resendApiKey = context.cloudflare.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return Response.json(
      {error: 'Email is not configured (missing RESEND_API_KEY).'},
      {status: 503},
    );
  }

  const id = params.id;
  const db = context.cloudflare.env.REIMBURSEMENT_DB;
  const sub = await db
    .prepare(
      'SELECT requester_name, requester_email, status, total_amount FROM submissions WHERE id = ?',
    )
    .bind(id)
    .first<{
      requester_name: string;
      requester_email: string;
      status: string;
      total_amount: number;
    }>();

  if (!sub) {
    return Response.json({error: 'Submission not found'}, {status: 404});
  }

  if (sub.status !== 'check_delivered') {
    return Response.json(
      {
        error:
          'Reminders can only be sent when the submission is in Check delivered status (requester was already told their check is ready).',
      },
      {status: 400},
    );
  }

  try {
    await sendCashCheckNudgeEmail({
      requesterName: sub.requester_name,
      requesterEmail: sub.requester_email,
      resendApiKey,
      totalAmountFormatted: formatUsd(Number(sub.total_amount)),
    });
  } catch (err) {
    console.error('Cash check nudge email failed:', err);
    return Response.json({error: 'Failed to send email. Try again or check logs.'}, {status: 502});
  }

  return Response.json({success: true});
}
