import {
  extractReceiptData,
  generateReceiptPDF,
  parseSubmissionReceiptLineForPdf,
  receiptFieldString,
} from '~/lib/reimbursement/receipt';
import {buildConvertedStagingPdfBasename} from '~/lib/reimbursement/receipt-staging-filenames';
import {
  attachConvertedToSubmission,
  type ConvertedJobData,
  dispatchSubmissionEmail,
  releaseEmailDispatchClaim,
  tryClaimEmailDispatch,
} from '~/lib/reimbursement/submission-finalize';

export interface ReceiptConversionQueueMessage {
  jobId: string;
}

interface QueueEnv {
  REIMBURSEMENT_DB: D1Database;
  R2_BUCKET: R2Bucket;
  GEMINI_API_KEY: string;
  RESEND_API_KEY?: string;
  NOTIFICATION_EMAIL?: string;
}

interface ReceiptConversionJobRow {
  id: string;
  status: 'queued' | 'processing' | 'complete' | 'error';
  original_key: string;
  original_filename: string;
  original_content_type: string;
  original_size: number;
  payable_to: string | null;
  receipt_number: string | null;
  reimbursement_draft_id: string | null;
  submission_id: string | null;
  submission_slug: string | null;
  receipt_line_index: number | null;
  converted_key: string | null;
  converted_filename: string | null;
  converted_size: number | null;
}

function queueLog(payload: Record<string, unknown>) {
  console.log(`[receipt-conversion-queue] ${JSON.stringify(payload)}`);
}

/**
 * After a job reaches a terminal state (complete or error), if it was claimed by a
 * submission, attach its converted PDF (when available) and try to dispatch the
 * deferred treasurer email if no other jobs are still pending for that submission.
 */
async function finalizeForSubmission(env: QueueEnv, job: ReceiptConversionJobRow): Promise<void> {
  const submissionId = job.submission_id;
  if (!submissionId) return;

  if (
    job.status === 'complete' &&
    job.submission_slug &&
    job.receipt_line_index != null &&
    job.converted_key &&
    job.converted_filename &&
    job.converted_size != null
  ) {
    const converted: ConvertedJobData = {
      jobId: job.id,
      submission_id: submissionId,
      submission_slug: job.submission_slug,
      receipt_line_index: job.receipt_line_index,
      original_content_type: job.original_content_type,
      converted_key: job.converted_key,
      converted_filename: job.converted_filename,
      converted_size: job.converted_size,
    };
    const result = await attachConvertedToSubmission(env, converted);
    if (!result.ok) {
      queueLog({
        jobId: job.id,
        outcome: 'attach_failed',
        submissionId,
        reason: result.reason,
      });
    }
  }

  const claimed = await tryClaimEmailDispatch(env.REIMBURSEMENT_DB, submissionId);
  if (claimed) {
    queueLog({jobId: job.id, outcome: 'email_claimed', submissionId});
    const sent = await dispatchSubmissionEmail(env, submissionId);
    if (!sent) {
      await releaseEmailDispatchClaim(env.REIMBURSEMENT_DB, submissionId);
    }
  }
}

async function loadLatestJobRow(
  db: D1Database,
  jobId: string,
): Promise<ReceiptConversionJobRow | null> {
  return db
    .prepare(
      `SELECT id, status, original_key, original_filename, original_content_type, original_size,
              payable_to, receipt_number, reimbursement_draft_id, submission_id, submission_slug, receipt_line_index,
              converted_key, converted_filename, converted_size
       FROM receipt_conversion_jobs
       WHERE id = ?`,
    )
    .bind(jobId)
    .first<ReceiptConversionJobRow>();
}

export async function processReceiptConversionJob(
  env: QueueEnv,
  message: ReceiptConversionQueueMessage,
): Promise<void> {
  const startedAt = Date.now();
  const {jobId} = message;

  const row = await loadLatestJobRow(env.REIMBURSEMENT_DB, jobId);

  if (!row) {
    queueLog({jobId, outcome: 'missing_job'});
    return;
  }

  // If the job is already terminal (e.g., reprocessed by the fast-path or a prior delivery),
  // make sure the submission-side bookkeeping has been done and exit.
  if (row.status === 'complete' || row.status === 'error') {
    await finalizeForSubmission(env, row);
    queueLog({jobId, outcome: 'already_terminal', status: row.status});
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

    const result = await extractReceiptData(
      fileBytes,
      row.original_content_type,
      env.GEMINI_API_KEY,
    );
    if ('error' in result) {
      throw new Error(result.error);
    }

    const lineForPdf = parseSubmissionReceiptLineForPdf(row.receipt_number);
    const titleReceiptLabel = lineForPdf ?? (row.receipt_number?.trim() || '1');
    const pdfTitle = row.payable_to
      ? `${row.payable_to}: Receipt ${titleReceiptLabel}`
      : 'Receipt Transcript';
    const pdfBuffer = generateReceiptPDF(result.receipts, pdfTitle, {
      submissionReceiptLine: lineForPdf,
    });

    const ts = Date.now();
    const stagingUuid = crypto.randomUUID();
    const convertedFilename = buildConvertedStagingPdfBasename({
      newUuid: stagingUuid,
      payableTo: row.payable_to,
      receiptLineIndex: row.receipt_line_index,
      receiptNumber: row.receipt_number,
      reimbursementDraftId: row.reimbursement_draft_id,
      timestamp: ts,
    });
    const convertedKey = `uploads/${convertedFilename}`;

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

    // If a submission has not claimed this job yet, the original upload must stay in R2
    // because `api.reimbursement.submit` copies it into `submissions/...` at submit time.
    // Deleting it here races users who upload, then finish the form later.
    if (row.submission_id) {
      await env.R2_BUCKET.delete(row.original_key);
    }

    queueLog({
      jobId,
      outcome: 'complete',
      extractHasTotal: result.receipts.some((r) => receiptFieldString(r.total).length > 0),
      totalMs: Date.now() - startedAt,
    });

    const latest = await loadLatestJobRow(env.REIMBURSEMENT_DB, jobId);
    if (latest?.submission_id) {
      await finalizeForSubmission(env, latest);
    }
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

    const latest = await loadLatestJobRow(env.REIMBURSEMENT_DB, jobId);
    if (latest?.submission_id) {
      try {
        await finalizeForSubmission(env, latest);
      } catch (finalizeErr) {
        console.error('[receipt-conversion-queue] finalizeForSubmission failed:', finalizeErr);
      }
    }

    // Do not rethrow: terminal failures are persisted; retrying would re-bill Gemini for the same job.
    return;
  }
}
