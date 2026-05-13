import {requireAdmin} from '~/lib/admin/auth';
import type {Route} from './+types/api.admin.reimbursement-school-year';

export async function action({request, params, context}: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return Response.json({error: 'Method not allowed'}, {status: 405});
  }

  const auth = await requireAdmin(request, context.cloudflare.env);
  if (auth instanceof Response) return auth;

  const id = params.id;
  if (!id) {
    return Response.json({error: 'Missing submission id'}, {status: 400});
  }

  const body = (await request.json()) as {school_year_id?: string};
  if (
    !body.school_year_id ||
    typeof body.school_year_id !== 'string' ||
    !body.school_year_id.trim()
  ) {
    return Response.json({error: 'school_year_id is required'}, {status: 400});
  }

  const schoolYearId = body.school_year_id.trim();
  const db = context.cloudflare.env.REIMBURSEMENT_DB;

  const year = await db
    .prepare('SELECT id FROM school_years WHERE id = ?')
    .bind(schoolYearId)
    .first<{id: string}>();
  if (!year) {
    return Response.json({error: 'School year not found'}, {status: 400});
  }

  const result = await db
    .prepare(`UPDATE submissions SET school_year_id = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(schoolYearId, id)
    .run();

  if ((result.meta?.changes ?? 0) === 0) {
    return Response.json({error: 'Submission not found'}, {status: 404});
  }

  return Response.json({success: true});
}
