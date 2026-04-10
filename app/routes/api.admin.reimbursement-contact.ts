import {requireAdmin} from '~/lib/admin/auth';
import {adminSubmissionContactSchema} from '~/lib/reimbursement/validation';
import type {Route} from './+types/api.admin.reimbursement-contact';

export async function action({request, params, context}: Route.ActionArgs) {
  const auth = await requireAdmin(request, context.cloudflare.env);
  if (auth instanceof Response) return auth;

  if (request.method !== 'POST') {
    return new Response(null, {status: 405});
  }

  const id = params.id;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({error: 'Invalid JSON body'}, {status: 400});
  }

  const parsed = adminSubmissionContactSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {error: 'Validation failed', details: parsed.error.flatten()},
      {status: 400},
    );
  }

  const {requester_name, requester_email, requester_phone} = parsed.data;
  const db = context.cloudflare.env.REIMBURSEMENT_DB;
  const result = await db
    .prepare(
      `UPDATE submissions
       SET requester_name = ?, requester_email = ?, requester_phone = ?, updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(requester_name, requester_email, requester_phone, id)
    .run();

  if (result.meta.changes === 0) {
    return Response.json({error: 'Submission not found'}, {status: 404});
  }

  return Response.json({success: true});
}
