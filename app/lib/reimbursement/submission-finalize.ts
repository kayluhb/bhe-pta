import {sendNotificationEmail} from '~/lib/reimbursement/email/resend';

interface SubmissionFinalizeEnv {
  REIMBURSEMENT_DB: D1Database;
  R2_BUCKET: R2Bucket;
  RESEND_API_KEY?: string;
  NOTIFICATION_EMAIL?: string;
}

export interface ConvertedJobData {
  jobId: string;
  submission_id: string;
  submission_slug: string;
  receipt_line_index: number;
  original_content_type?: string;
  converted_key: string;
  converted_filename: string;
  converted_size: number;
}

interface SubmissionRow {
  id: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  requester_address: string | null;
  date_check_needed: string | null;
  total_amount: number;
  pdf_key: string | null;
}

interface FileAttachmentRow {
  r2_key: string;
  original_filename: string;
  content_type: string;
  sort_order: number;
}

interface ReceiptEntryRow {
  description: string;
  amount: number;
  category: string | null;
  sort_order: number;
}

function finalizeLog(payload: Record<string, unknown>) {
  console.log(`[submission-finalize] ${JSON.stringify(payload)}`);
}

function jobSuffix(jobId: string): string {
  return jobId.split('-')[0] || jobId.slice(0, 8);
}

/**
 * Move a converted PDF from its staging key (`uploads/...`) to the friendly
 * `submissions/{id}/{slug}-receipt-{lineIdx}-{jobSuffix}.pdf` and insert a `file_attachments` row.
 * Idempotent: if a `file_attachments` row already exists for the friendly key it returns
 * without re-doing work, and skips the move if the staging object is already gone.
 */
export async function attachConvertedToSubmission(
  env: SubmissionFinalizeEnv,
  job: ConvertedJobData,
): Promise<{ok: true; key: string} | {ok: false; reason: string}> {
  const {
    jobId,
    submission_id: submissionId,
    submission_slug: slug,
    receipt_line_index: lineIdx,
    converted_key: stagingKey,
    converted_size: convertedSize,
  } = job;

  const friendlyFilename = `${slug}-receipt-${lineIdx}-${jobSuffix(jobId)}.pdf`;
  const friendlyKey = `submissions/${submissionId}/${friendlyFilename}`;
  const originalFriendlyPdfKey = `submissions/${submissionId}/${slug}-receipt-${lineIdx}-${jobSuffix(jobId)}-original.pdf`;

  // Idempotency: if we already inserted this attachment, bail out.
  const existing = await env.REIMBURSEMENT_DB.prepare(
    'SELECT id FROM file_attachments WHERE submission_id = ? AND r2_key = ?',
  )
    .bind(submissionId, friendlyKey)
    .first<{id: string}>();

  if (existing) {
    finalizeLog({jobId, outcome: 'attach_skipped_already_present', friendlyKey});
    return {ok: true, key: friendlyKey};
  }

  // Move the object if it's still at the staging key.
  if (stagingKey !== friendlyKey) {
    const obj = await env.R2_BUCKET.get(stagingKey);
    if (obj) {
      await env.R2_BUCKET.put(friendlyKey, await obj.arrayBuffer(), {
        httpMetadata: {contentType: 'application/pdf'},
      });
      await env.R2_BUCKET.delete(stagingKey);
    } else {
      // Staging object missing; verify the friendly key already exists in R2 before inserting the row.
      const friendlyHead = await env.R2_BUCKET.head(friendlyKey);
      if (!friendlyHead) {
        finalizeLog({jobId, outcome: 'attach_failed_missing_r2_object', stagingKey, friendlyKey});
        return {ok: false, reason: 'converted PDF missing in R2'};
      }
    }
  }

  // Determine sort_order: append at the end.
  const maxSort = await env.REIMBURSEMENT_DB.prepare(
    'SELECT MAX(sort_order) as max_sort FROM file_attachments WHERE submission_id = ?',
  )
    .bind(submissionId)
    .first<{max_sort: number | null}>();
  const nextSort = (maxSort?.max_sort ?? -1) + 1;

  await env.REIMBURSEMENT_DB.prepare(
    `INSERT INTO file_attachments (id, submission_id, r2_key, original_filename, content_type, file_size, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      crypto.randomUUID(),
      submissionId,
      friendlyKey,
      friendlyFilename,
      'application/pdf',
      convertedSize,
      nextSort,
    )
    .run();

  // For original PDF uploads, keep only one PDF attachment by replacing
  // the original with the converted/transcribed PDF.
  if (job.original_content_type === 'application/pdf') {
    await env.REIMBURSEMENT_DB.prepare(
      'DELETE FROM file_attachments WHERE submission_id = ? AND r2_key = ?',
    )
      .bind(submissionId, originalFriendlyPdfKey)
      .run();
    try {
      await env.R2_BUCKET.delete(originalFriendlyPdfKey);
    } catch (error) {
      finalizeLog({
        jobId,
        outcome: 'original_pdf_cleanup_failed',
        originalFriendlyPdfKey,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Update the job row's converted_key so it reflects the post-move location.
  await env.REIMBURSEMENT_DB.prepare(
    `UPDATE receipt_conversion_jobs
     SET converted_key = ?, converted_filename = ?, updated_at = datetime('now')
     WHERE id = ?`,
  )
    .bind(friendlyKey, friendlyFilename, jobId)
    .run();

  await env.REIMBURSEMENT_DB.prepare(
    `UPDATE submissions SET updated_at = datetime('now') WHERE id = ?`,
  )
    .bind(submissionId)
    .run();

  finalizeLog({
    jobId,
    outcome: 'attach_complete',
    friendlyKey,
    convertedFilename: friendlyFilename,
    convertedSize,
  });
  return {ok: true, key: friendlyKey};
}

/**
 * Atomically claims responsibility for sending the treasurer email for a submission.
 *
 * Returns true exactly once, when:
 *   - `email_sent_at` was previously NULL, AND
 *   - no `receipt_conversion_jobs` rows for this submission are still pending
 *     (i.e. status NOT IN ('complete', 'error')).
 *
 * Callers that get true must dispatch the email; callers that get false should
 * not, because either (a) someone else already did, or (b) there are still
 * pending conversion jobs.
 */
export async function tryClaimEmailDispatch(
  db: D1Database,
  submissionId: string,
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE submissions
         SET email_sent_at = datetime('now')
       WHERE id = ?
         AND email_sent_at IS NULL`,
    )
    .bind(submissionId)
    .run();

  return (result.meta?.changes ?? 0) === 1;
}

/**
 * Releases an email-dispatch claim by setting `email_sent_at` back to NULL.
 * Use only when a transient error means another caller (e.g., a queue retry)
 * should be allowed to try again.
 */
export async function releaseEmailDispatchClaim(
  db: D1Database,
  submissionId: string,
): Promise<void> {
  await db
    .prepare('UPDATE submissions SET email_sent_at = NULL WHERE id = ?')
    .bind(submissionId)
    .run();
}

/**
 * Loads the submission's stored data + R2 attachments and sends the treasurer email.
 * Failures are logged and swallowed (matches today's submit-time behavior). Returns true
 * when the email was actually sent, false when configuration is missing or on failure.
 */
export async function dispatchSubmissionEmail(
  env: SubmissionFinalizeEnv,
  submissionId: string,
): Promise<boolean> {
  const resendApiKey = env.RESEND_API_KEY;
  const notificationEmail = env.NOTIFICATION_EMAIL;
  if (!resendApiKey || !notificationEmail) {
    finalizeLog({submissionId, outcome: 'email_skipped_unconfigured'});
    return false;
  }

  try {
    const submission = await env.REIMBURSEMENT_DB.prepare(
      `SELECT id, requester_name, requester_email, requester_phone, requester_address,
              date_check_needed, total_amount, pdf_key
       FROM submissions WHERE id = ?`,
    )
      .bind(submissionId)
      .first<SubmissionRow>();

    if (!submission) {
      finalizeLog({submissionId, outcome: 'email_skipped_missing_submission'});
      return false;
    }

    const receiptRowsResult = await env.REIMBURSEMENT_DB.prepare(
      `SELECT description, amount, category, sort_order
       FROM receipt_entries WHERE submission_id = ? ORDER BY sort_order`,
    )
      .bind(submissionId)
      .all<ReceiptEntryRow>();

    const fileRowsResult = await env.REIMBURSEMENT_DB.prepare(
      `SELECT r2_key, original_filename, content_type, sort_order
       FROM file_attachments WHERE submission_id = ? ORDER BY sort_order`,
    )
      .bind(submissionId)
      .all<FileAttachmentRow>();

    const receiptRows = receiptRowsResult.results ?? [];
    const fileRows = fileRowsResult.results ?? [];

    if (!submission.pdf_key) {
      finalizeLog({submissionId, outcome: 'email_skipped_no_pdf_key'});
      return false;
    }

    const pdfObj = await env.R2_BUCKET.get(submission.pdf_key);
    if (!pdfObj) {
      finalizeLog({submissionId, outcome: 'email_skipped_pdf_missing_in_r2'});
      return false;
    }
    const pdfBuffer = new Uint8Array(await pdfObj.arrayBuffer());
    const pdfFilename = submission.pdf_key.split('/').pop() ?? `${submissionId}.pdf`;

    const fileAttachments: Array<{
      filename: string;
      content: Uint8Array;
      contentType: string;
    }> = [];
    for (const row of fileRows) {
      try {
        const obj = await env.R2_BUCKET.get(row.r2_key);
        if (!obj) continue;
        fileAttachments.push({
          filename: row.original_filename,
          content: new Uint8Array(await obj.arrayBuffer()),
          contentType: row.content_type,
        });
      } catch (err) {
        finalizeLog({
          submissionId,
          outcome: 'email_attachment_load_failed',
          r2Key: row.r2_key,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    await sendNotificationEmail({
      submission: {
        id: submission.id,
        totalAmount: Number(submission.total_amount),
      },
      requester: {
        payableTo: submission.requester_name,
        email: submission.requester_email,
        phone: submission.requester_phone ?? undefined,
        address: submission.requester_address ?? '',
        dateCheckNeeded: submission.date_check_needed ?? '',
      },
      receipts: receiptRows.map((r) => ({
        description: r.description,
        amount: Number(r.amount),
        budgetAccount: r.category ?? '',
      })),
      pdfBuffer,
      pdfFilename,
      fileAttachments,
      notificationEmail,
      resendApiKey,
    });

    finalizeLog({
      submissionId,
      outcome: 'email_sent',
      attachmentCount: fileAttachments.length,
    });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    finalizeLog({submissionId, outcome: 'email_failed', error: message});
    console.error('[submission-finalize] email dispatch failed:', error);
    return false;
  }
}
