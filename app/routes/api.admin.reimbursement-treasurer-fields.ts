import {requireAdmin} from '~/lib/admin/auth';
import {getCloudflare} from '~/lib/cloudflare-context';
import {regenerateStoredSubmissionPdf} from '~/lib/reimbursement/pdf/regenerate-stored-pdf';
import {adminTreasurerFieldsSchema} from '~/lib/reimbursement/validation';
import type {Route} from './+types/api.admin.reimbursement-treasurer-fields';

export async function action({request, params, context}: Route.ActionArgs) {
  const auth = await requireAdmin(request, getCloudflare(context).env);
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

  const parsed = adminTreasurerFieldsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {error: 'Validation failed', details: parsed.error.flatten()},
      {status: 400},
    );
  }

  const {check_amount, check_number, date_paid} = parsed.data;
  const db = getCloudflare(context).env.REIMBURSEMENT_DB;
  const result = await db
    .prepare(
      `UPDATE submissions SET
         check_amount = ?,
         check_number = ?,
         date_paid = ?,
         updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(check_amount, check_number, date_paid, id)
    .run();

  if (result.meta.changes === 0) {
    return Response.json({error: 'Submission not found'}, {status: 404});
  }

  const pdfResult = await regenerateStoredSubmissionPdf(
    db,
    getCloudflare(context).env.R2_BUCKET,
    id,
  );

  if (!pdfResult.ok) {
    const warning =
      pdfResult.reason === 'no_r2'
        ? 'Check details saved. The PDF was not updated (file storage is not configured).'
        : pdfResult.reason === 'generate_failed'
          ? 'Check details saved, but the PDF could not be regenerated. Use “Regenerate PDF” to try again.'
          : 'Check details saved. The PDF could not be refreshed.';
    return Response.json({pdfRegenerated: false, success: true, warning});
  }

  return Response.json({pdfKey: pdfResult.pdfKey, pdfRegenerated: true, success: true});
}
