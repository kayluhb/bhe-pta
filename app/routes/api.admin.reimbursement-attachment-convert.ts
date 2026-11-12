import {requireAdmin} from '~/lib/admin/auth';
import {getCloudflare} from '~/lib/cloudflare-context';
import {buildAdminReceiptPdfTitle} from '~/lib/reimbursement/filename';
import {extractReceiptData, generateReceiptPDF} from '~/lib/reimbursement/receipt';
import {
  checkClaimedAmountsAgainstReceipts,
  mergeAmountAlertsIntoAdminNotes,
  type ReceiptAmountAlert,
  stripReceiptConversionNotes,
} from '~/lib/reimbursement/receipt-amount-check';
import type {Route} from './+types/api.admin.reimbursement-attachment-convert';

interface SubmissionRow {
  admin_notes: string | null;
  id: string;
  requester_name: string;
  total_amount: number;
}

interface AttachmentRow {
  content_type: string;
  id: string;
  original_filename: string;
  r2_key: string;
  submission_id: string;
}

interface ExistingPdfRow {
  id: string;
  original_filename: string;
}

const PDF_CONTENT_TYPE = 'application/pdf';

export async function action({request, params, context}: Route.ActionArgs) {
  const env = getCloudflare(context).env;
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  try {
    const submissionId = params.id;
    const attachmentId = params.attachmentId;
    const db = env.REIMBURSEMENT_DB;
    const r2 = env.R2_BUCKET;

    const submission = await db
      .prepare('SELECT id, requester_name, total_amount, admin_notes FROM submissions WHERE id = ?')
      .bind(submissionId)
      .first<SubmissionRow>();
    if (!submission) {
      return Response.json({error: 'Submission not found'}, {status: 404});
    }

    const attachment = await db
      .prepare(
        `SELECT id, submission_id, r2_key, original_filename, content_type
         FROM file_attachments
         WHERE id = ? AND submission_id = ?`,
      )
      .bind(attachmentId, submissionId)
      .first<AttachmentRow>();
    if (!attachment) {
      return Response.json({error: 'Attachment not found'}, {status: 404});
    }

    const baseName = attachment.original_filename.replace(/\.[^.]+$/, '');
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const withoutOriginalSuffix = sanitizedName.replace(/-original$/i, '');

    // Avoid duplicate "converted" assets for the same original upload.
    const existingPdf = await db
      .prepare(
        `SELECT id, original_filename
         FROM file_attachments
         WHERE submission_id = ?
           AND id != ?
           AND content_type = ?
           AND (
             original_filename = ?
             OR original_filename = ?
             OR original_filename = ?
           )
         LIMIT 1`,
      )
      .bind(
        submissionId,
        attachmentId,
        PDF_CONTENT_TYPE,
        `${withoutOriginalSuffix}.pdf`,
        `${withoutOriginalSuffix}-converted.pdf`,
        `${sanitizedName}-converted.pdf`,
      )
      .first<ExistingPdfRow>();
    if (existingPdf) {
      return Response.json({
        existingFilename: existingPdf.original_filename,
        skipped: true,
        success: true,
      });
    }

    const originalObj = await r2.get(attachment.r2_key);
    if (!originalObj) {
      return Response.json({error: 'Original file is missing from storage.'}, {status: 404});
    }

    const fileBytes = new Uint8Array(await originalObj.arrayBuffer());
    if (fileBytes.byteLength === 0) {
      return Response.json({error: 'Stored file is empty.'}, {status: 400});
    }

    const result = await extractReceiptData(fileBytes, attachment.content_type, env.GEMINI_API_KEY);
    if ('error' in result) {
      return Response.json({error: result.error}, {status: result.status});
    }

    const receiptTitle = buildAdminReceiptPdfTitle(submission.requester_name, sanitizedName);
    const pdfBuffer = generateReceiptPDF(result.receipts, receiptTitle);
    const pdfFilename = `${sanitizedName}-converted.pdf`;
    const pdfKey = `submissions/${submissionId}/${pdfFilename}`;

    await r2.put(pdfKey, pdfBuffer, {httpMetadata: {contentType: PDF_CONTENT_TYPE}});

    const maxSort = await db
      .prepare('SELECT MAX(sort_order) as max_sort FROM file_attachments WHERE submission_id = ?')
      .bind(submissionId)
      .first<{max_sort: number | null}>();
    const nextSort = (maxSort?.max_sort ?? -1) + 1;

    const receiptAmountRows = await db
      .prepare('SELECT amount FROM receipt_entries WHERE submission_id = ? ORDER BY sort_order')
      .bind(submissionId)
      .all<{amount: number}>();
    const receiptLineAmounts = (receiptAmountRows.results ?? []).map((r) => Number(r.amount));
    const claimedAmounts =
      receiptLineAmounts.length > 0
        ? receiptLineAmounts
        : [Number(submission.total_amount)].filter((n) => Number.isFinite(n) && n > 0);
    const amountAlerts: ReceiptAmountAlert[] = checkClaimedAmountsAgainstReceipts({
      claimedAmounts,
      receipts: result.receipts,
    });
    // Drop prior conversion notes, then append any new alerts (clears false positives on re-convert).
    const notesBase = stripReceiptConversionNotes(submission.admin_notes);
    const mergedNotes = mergeAmountAlertsIntoAdminNotes(notesBase, amountAlerts);

    const statements = [
      db
        .prepare(
          `INSERT INTO file_attachments (id, submission_id, r2_key, original_filename, content_type, file_size, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          submissionId,
          pdfKey,
          pdfFilename,
          PDF_CONTENT_TYPE,
          pdfBuffer.length,
          nextSort,
        ),
    ];
    if (
      (mergedNotes ?? null) !== (submission.admin_notes ?? null) &&
      (mergedNotes ?? '') !== (submission.admin_notes ?? '').trim()
    ) {
      statements.push(
        db
          .prepare(
            `UPDATE submissions SET admin_notes = ?, updated_at = datetime('now') WHERE id = ?`,
          )
          .bind(mergedNotes, submissionId),
      );
    }
    await db.batch(statements);

    return Response.json({
      amountAlerts,
      file: {content_type: PDF_CONTENT_TYPE, filename: pdfFilename, size: pdfBuffer.length},
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Admin attachment convert error:', message, error);
    return Response.json({error: 'Failed to convert attachment. Please try again.'}, {status: 500});
  }
}
