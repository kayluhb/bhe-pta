import {requireAdmin} from '~/lib/admin/auth';
import {getCloudflare} from '~/lib/cloudflare-context';
import {regenerateStoredSubmissionPdf} from '~/lib/reimbursement/pdf/regenerate-stored-pdf';
import {adminReceiptCategorySchema} from '~/lib/reimbursement/validation';
import type {Route} from './+types/api.admin.reimbursement-receipt-delete';

export async function action({request, params, context}: Route.ActionArgs) {
  const env = getCloudflare(context).env;
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const submissionId = params.id;
  const receiptId = params.receiptId;
  const db = env.REIMBURSEMENT_DB;

  if (request.method === 'POST') {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({error: 'Invalid JSON body'}, {status: 400});
    }

    const parsed = adminReceiptCategorySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {error: 'Validation failed', details: parsed.error.flatten()},
        {status: 400},
      );
    }

    const {category} = parsed.data;
    const updateResult = await db
      .prepare(
        `UPDATE receipt_entries
         SET category = ?
         WHERE id = ? AND submission_id = ?`,
      )
      .bind(category, receiptId, submissionId)
      .run();

    if (updateResult.meta.changes === 0) {
      return Response.json({error: 'Line item not found'}, {status: 404});
    }

    await db
      .prepare(
        `UPDATE submissions
         SET updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(submissionId)
      .run();

    const pdfResult = await regenerateStoredSubmissionPdf(db, env.R2_BUCKET, submissionId);

    if (!pdfResult.ok) {
      const warning =
        pdfResult.reason === 'no_r2'
          ? 'Budget account saved. The PDF was not updated (file storage is not configured).'
          : pdfResult.reason === 'generate_failed'
            ? 'Budget account saved, but the PDF could not be regenerated. Use “Regenerate PDF” to try again.'
            : 'Budget account saved. The PDF could not be refreshed.';
      return Response.json({pdfRegenerated: false, success: true, warning});
    }

    return Response.json({pdfKey: pdfResult.pdfKey, pdfRegenerated: true, success: true});
  }

  if (request.method !== 'DELETE') {
    return new Response(null, {status: 405});
  }

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
