import {requireAdmin} from '~/lib/admin/auth';
import {getCloudflare} from '~/lib/cloudflare-context';
import {buildAdminReceiptPdfTitle, sanitizeDownloadFilename} from '~/lib/reimbursement/filename';
import {
  checkSubmittedAmountAgainstReceipts,
  mergeAmountAlertsIntoAdminNotes,
  resolveSubmittedAmountForCheck,
  type ReceiptAmountAlert,
} from '~/lib/reimbursement/receipt-amount-check';
import {
  ACCEPTED_TYPES,
  extractReceiptData,
  generateReceiptPDF,
  MAX_FILE_SIZE,
} from '~/lib/reimbursement/receipt';
import type {Route} from './+types/api.admin.reimbursement-upload';

export async function action({request, params, context}: Route.ActionArgs) {
  const env = getCloudflare(context).env;
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  try {
    const submissionId = params.id;
    const db = env.REIMBURSEMENT_DB;

    // Verify submission exists and get requester name
    const submission = await db
      .prepare('SELECT id, requester_name, total_amount, admin_notes FROM submissions WHERE id = ?')
      .bind(submissionId)
      .first<{
        admin_notes: string | null;
        id: string;
        requester_name: string;
        total_amount: number;
      }>();

    if (!submission) {
      return Response.json({error: 'Submission not found'}, {status: 404});
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({error: 'No file provided'}, {status: 400});
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      return Response.json(
        {error: 'Invalid file type. Only JPEG, PNG, WebP, and PDF files are accepted.'},
        {status: 400},
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json({error: 'File too large. Maximum 10MB.'}, {status: 400});
    }

    const fileBytes = new Uint8Array(await file.arrayBuffer());
    if (fileBytes.byteLength === 0) {
      return Response.json({error: 'Uploaded file was empty.'}, {status: 400});
    }

    // Extract receipt data via Gemini (same bytes as R2 original — single read for Workers)
    const result = await extractReceiptData(fileBytes, file.type, env.GEMINI_API_KEY);
    if ('error' in result) {
      return Response.json({error: result.error}, {status: result.status});
    }
    const {receipts} = result;

    // Get next sort order
    const maxSort = await db
      .prepare('SELECT MAX(sort_order) as max_sort FROM file_attachments WHERE submission_id = ?')
      .bind(submissionId)
      .first<{max_sort: number | null}>();
    const nextSort = (maxSort?.max_sort ?? -1) + 1;

    // Generate formatted PDF
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const receiptTitle = buildAdminReceiptPdfTitle(submission.requester_name, sanitizedName);
    const pdfBuffer = generateReceiptPDF(receipts, receiptTitle);

    const isPDF = file.type === 'application/pdf';
    const pdfKey = `submissions/${submissionId}/${sanitizedName}-converted.pdf`;
    const originalExt = file.name.split('.').pop() || (isPDF ? 'pdf' : 'jpg');
    const originalKey = `submissions/${submissionId}/${sanitizedName}-original.${originalExt}`;

    // Upload both files to R2 and insert DB records
    const r2 = env.R2_BUCKET;
    await Promise.all([
      r2.put(pdfKey, pdfBuffer, {httpMetadata: {contentType: 'application/pdf'}}),
      r2.put(originalKey, fileBytes, {httpMetadata: {contentType: file.type}}),
    ]);

    const originalFilename = sanitizeDownloadFilename(file.name);

    const receiptAmountRows = await db
      .prepare('SELECT amount FROM receipt_entries WHERE submission_id = ? ORDER BY sort_order')
      .bind(submissionId)
      .all<{amount: number}>();
    const receiptLineAmounts = (receiptAmountRows.results ?? []).map((r) => Number(r.amount));
    const submittedAmount = resolveSubmittedAmountForCheck({
      receiptLineAmounts,
      submissionTotal: Number(submission.total_amount),
    });
    const amountAlerts: ReceiptAmountAlert[] =
      submittedAmount != null
        ? checkSubmittedAmountAgainstReceipts(submittedAmount, receipts)
        : [];
    const mergedNotes = mergeAmountAlertsIntoAdminNotes(submission.admin_notes, amountAlerts);

    const statements = [
      db
        .prepare(
          'INSERT INTO file_attachments (id, submission_id, r2_key, original_filename, content_type, file_size, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
        )
        .bind(
          crypto.randomUUID(),
          submissionId,
          pdfKey,
          `${sanitizedName}-converted.pdf`,
          'application/pdf',
          pdfBuffer.length,
          nextSort,
        ),
      db
        .prepare(
          'INSERT INTO file_attachments (id, submission_id, r2_key, original_filename, content_type, file_size, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
        )
        .bind(
          crypto.randomUUID(),
          submissionId,
          originalKey,
          originalFilename,
          file.type,
          fileBytes.byteLength,
          nextSort + 1,
        ),
    ];
    if (amountAlerts.length > 0 && mergedNotes !== (submission.admin_notes ?? '').trim()) {
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
      success: true,
      files: [
        {filename: `${sanitizedName}-converted.pdf`, size: pdfBuffer.length},
        {filename: originalFilename, size: file.size},
      ],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Admin upload error:', message, error);
    return Response.json({error: 'Failed to process upload. Please try again.'}, {status: 500});
  }
}
