import {
  extractReceiptData,
  generateReceiptPDF,
  parseSubmissionReceiptLineForPdf,
  receiptFieldString,
} from '~/lib/reimbursement/receipt';

export interface ReceiptConversionQueueMessage {
  jobId: string;
}

interface QueueEnv {
  REIMBURSEMENT_DB: D1Database;
  R2_BUCKET: R2Bucket;
  GEMINI_API_KEY: string;
}

interface ReceiptConversionJobRow {
  id: string;
  original_key: string;
  original_filename: string;
  original_content_type: string;
  original_size: number;
  payable_to: string | null;
  receipt_number: string | null;
}

function queueLog(payload: Record<string, unknown>) {
  console.log(`[receipt-conversion-queue] ${JSON.stringify(payload)}`);
}

export async function processReceiptConversionJob(
  env: QueueEnv,
  message: ReceiptConversionQueueMessage,
): Promise<void> {
  const startedAt = Date.now();
  const {jobId} = message;

  const row = await env.REIMBURSEMENT_DB.prepare(
    `SELECT id, original_key, original_filename, original_content_type, original_size, payable_to, receipt_number
     FROM receipt_conversion_jobs
     WHERE id = ?`,
  )
    .bind(jobId)
    .first<ReceiptConversionJobRow>();

  if (!row) {
    queueLog({jobId, outcome: 'missing_job'});
    return;
  }

  await env.REIMBURSEMENT_DB.prepare(
    `UPDATE receipt_conversion_jobs
     SET status = 'processing', updated_at = datetime('now')
     WHERE id = ?`,
  )
    .bind(jobId)
    .run();

  try {
    const originalObj = await env.R2_BUCKET.get(row.original_key);
    if (!originalObj) {
      throw new Error('Original upload is missing from storage.');
    }

    const fileBytes = new Uint8Array(await originalObj.arrayBuffer());
    if (fileBytes.byteLength === 0) {
      throw new Error('Original upload is empty.');
    }

    const result = await extractReceiptData(fileBytes, row.original_content_type, env.GEMINI_API_KEY);
    if ('error' in result) {
      throw new Error(result.error);
    }

    const lineForPdf = parseSubmissionReceiptLineForPdf(row.receipt_number);
    const titleReceiptLabel = lineForPdf ?? (row.receipt_number?.trim() || '1');
    const pdfTitle = row.payable_to
      ? `${row.payable_to}: Receipt ${titleReceiptLabel}`
      : 'Receipt Transcript';
    const pdfBuffer = generateReceiptPDF(result.receipt, pdfTitle, {
      submissionReceiptLine: lineForPdf,
    });

    const baseName = row.original_filename.replace(/\.[^.]+$/, '');
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const convertedKey = `uploads/${Date.now()}-${crypto.randomUUID()}-${sanitizedName}.pdf`;
    const convertedFilename = `${sanitizedName}-converted.pdf`;

    await env.R2_BUCKET.put(convertedKey, pdfBuffer, {
      httpMetadata: {contentType: 'application/pdf'},
    });

    await env.REIMBURSEMENT_DB.prepare(
      `UPDATE receipt_conversion_jobs
       SET status = 'complete',
           converted_key = ?,
           converted_filename = ?,
           converted_size = ?,
           error_message = NULL,
           updated_at = datetime('now')
       WHERE id = ?`,
    )
      .bind(convertedKey, convertedFilename, pdfBuffer.length, jobId)
      .run();

    queueLog({
      jobId,
      outcome: 'complete',
      extractHasTotal: receiptFieldString(result.receipt.total).length > 0,
      totalMs: Date.now() - startedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await env.REIMBURSEMENT_DB.prepare(
      `UPDATE receipt_conversion_jobs
       SET status = 'error',
           error_message = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
    )
      .bind(message, jobId)
      .run();

    queueLog({jobId, outcome: 'error', error: message, totalMs: Date.now() - startedAt});
    throw error;
  }
}
