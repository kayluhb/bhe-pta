import {requireAdmin} from '~/lib/admin/auth';
import {buildPdfFilename, slugifyName} from '~/lib/reimbursement/filename';
import {buildPdfDataFromSubmission} from '~/lib/reimbursement/pdf/from-submission';
import {generatePDF} from '~/lib/reimbursement/pdf/generator';
import type {Route} from './+types/api.admin.reimbursement-pdf-regenerate';

export async function action({request, params, context}: Route.ActionArgs) {
  const auth = await requireAdmin(request, context.cloudflare.env);
  if (auth instanceof Response) return auth;

  if (request.method !== 'POST') {
    return new Response(null, {status: 405});
  }

  const submissionId = params.id;
  const r2 = context.cloudflare.env.R2_BUCKET;
  if (!r2) {
    return Response.json({error: 'File storage is not configured'}, {status: 503});
  }

  const db = context.cloudflare.env.REIMBURSEMENT_DB;

  const submission = await db
    .prepare(
      `SELECT id, requester_name, requester_email, requester_phone, total_amount, pdf_key, submitted_at
       FROM submissions WHERE id = ?`,
    )
    .bind(submissionId)
    .first<{
      id: string;
      requester_name: string;
      requester_email: string;
      requester_phone: string | null;
      total_amount: number;
      pdf_key: string | null;
      submitted_at: string;
    }>();

  if (!submission) {
    return Response.json({error: 'Submission not found'}, {status: 404});
  }

  const receiptRows = await db
    .prepare(
      `SELECT receipt_date, description, amount, category, vendor
       FROM receipt_entries WHERE submission_id = ? ORDER BY sort_order`,
    )
    .bind(submissionId)
    .all<{
      receipt_date: string;
      description: string;
      amount: number;
      category: string | null;
      vendor: string | null;
    }>();

  const pdfData = buildPdfDataFromSubmission(submission, receiptRows.results);
  let pdfBuffer: Uint8Array;
  try {
    pdfBuffer = await generatePDF(pdfData);
  } catch (e) {
    console.error('PDF regenerate error:', e);
    return Response.json({error: 'Failed to generate PDF'}, {status: 500});
  }

  const datePrefix = submission.submitted_at.slice(0, 10);
  const slug = slugifyName(submission.requester_name, datePrefix);
  const pdfFilename = buildPdfFilename(slug);
  const newKey = `submissions/${submissionId}/${pdfFilename}`;

  const oldKey = submission.pdf_key;
  await r2.put(newKey, pdfBuffer, {
    httpMetadata: {contentType: 'application/pdf'},
  });
  if (oldKey && oldKey !== newKey) {
    await r2.delete(oldKey);
  }

  await db
    .prepare(
      `UPDATE submissions SET pdf_key = ?, updated_at = datetime('now') WHERE id = ?`,
    )
    .bind(newKey, submissionId)
    .run();

  return Response.json({success: true, pdfKey: newKey});
}
