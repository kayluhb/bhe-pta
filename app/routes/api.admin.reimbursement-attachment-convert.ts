import {requireAdmin} from '~/lib/admin/auth';
import {extractReceiptData, generateReceiptPDF} from '~/lib/reimbursement/receipt';
import type {Route} from './+types/api.admin.reimbursement-attachment-convert';

interface SubmissionRow {
  id: string;
  requester_name: string;
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

export async function action({request, params, context}: Route.ActionArgs) {
  const auth = await requireAdmin(request, context.cloudflare.env);
  if (auth instanceof Response) return auth;

  try {
    const submissionId = params.id;
    const attachmentId = params.attachmentId;
    const env = context.cloudflare.env;
    const db = env.REIMBURSEMENT_DB;
    const r2 = env.R2_BUCKET;

    const submission = await db
      .prepare('SELECT id, requester_name FROM submissions WHERE id = ?')
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
           AND content_type = 'application/pdf'
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

    const receiptTitle = `${submission.requester_name}: ${sanitizedName}`;
    const pdfBuffer = generateReceiptPDF(result.receipts, receiptTitle);
    const pdfFilename = `${sanitizedName}-converted.pdf`;
    const pdfKey = `submissions/${submissionId}/${Date.now()}-${crypto.randomUUID()}-${pdfFilename}`;

    await r2.put(pdfKey, pdfBuffer, {httpMetadata: {contentType: 'application/pdf'}});

    const maxSort = await db
      .prepare('SELECT MAX(sort_order) as max_sort FROM file_attachments WHERE submission_id = ?')
      .bind(submissionId)
      .first<{max_sort: number | null}>();
    const nextSort = (maxSort?.max_sort ?? -1) + 1;

    await db
      .prepare(
        `INSERT INTO file_attachments (id, submission_id, r2_key, original_filename, content_type, file_size, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        submissionId,
        pdfKey,
        pdfFilename,
        'application/pdf',
        pdfBuffer.length,
        nextSort,
      )
      .run();

    return Response.json({
      file: {content_type: 'application/pdf', filename: pdfFilename, size: pdfBuffer.length},
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Admin attachment convert error:', message, error);
    return Response.json({error: 'Failed to convert attachment. Please try again.'}, {status: 500});
  }
}
