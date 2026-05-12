import {buildPdfFilename, slugifyName} from '~/lib/reimbursement/filename';
import {buildPdfDataFromSubmission} from '~/lib/reimbursement/pdf/from-submission';
import {generatePDF} from '~/lib/reimbursement/pdf/generator';

export type RegenerateStoredPdfResult =
  | {ok: true; pdfKey: string}
  | {ok: false; reason: 'no_r2' | 'not_found' | 'generate_failed'; message?: string};

/**
 * Rebuilds the check-request PDF from D1, uploads to R2, updates `pdf_key`, and deletes the prior key
 * when the filename changes.
 */
export async function regenerateStoredSubmissionPdf(
  db: D1Database,
  r2: R2Bucket | undefined,
  submissionId: string,
): Promise<RegenerateStoredPdfResult> {
  if (!r2) {
    return {ok: false, reason: 'no_r2'};
  }

  const submission = await db
    .prepare(
      `SELECT id, requester_name, requester_email, requester_phone, total_amount, pdf_key, submitted_at,
              check_amount, check_number, date_approved, date_paid
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
      check_amount: number | null;
      check_number: string | null;
      date_approved: string | null;
      date_paid: string | null;
    }>();

  if (!submission) {
    return {ok: false, reason: 'not_found'};
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
    console.error('regenerateStoredSubmissionPdf:', e);
    return {
      ok: false,
      reason: 'generate_failed',
      message: e instanceof Error ? e.message : 'Failed to generate PDF',
    };
  }

  const datePrefix = submission.submitted_at.slice(0, 10);
  const priorBasename =
    submission.pdf_key
      ?.split('/')
      .pop()
      ?.replace(/\.pdf$/i, '')
      ?.trim() ?? '';
  const slug = priorBasename.length
    ? priorBasename
    : slugifyName(submission.requester_name, datePrefix);
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
    .prepare(`UPDATE submissions SET pdf_key = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(newKey, submissionId)
    .run();

  return {ok: true, pdfKey: newKey};
}
