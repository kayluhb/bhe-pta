import {buildPdfFilename, slugifyName} from '~/lib/reimbursement/filename';
import {generatePDF} from '~/lib/reimbursement/pdf/generator';
import {
  attachConvertedToSubmission,
  type ConvertedJobData,
  dispatchSubmissionEmail,
  releaseEmailDispatchClaim,
  tryClaimEmailDispatch,
} from '~/lib/reimbursement/submission-finalize';
import {resolveSchoolYearIdForNewSubmission} from '~/lib/reimbursement/school-years';
import {submissionSchema} from '~/lib/reimbursement/validation';
import type {Route} from './+types/api.reimbursement.submit';

interface ReceiptConversionJobRow {
  id: string;
  status: 'queued' | 'processing' | 'complete' | 'error';
  original_key: string;
  original_filename: string;
  original_content_type: string;
  original_size: number;
  converted_key: string | null;
  converted_filename: string | null;
  converted_size: number | null;
  submission_id: string | null;
}

function isSchemaOutdatedError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('no such column') ||
    message.includes('has no column named') ||
    message.includes('school_year_id') ||
    message.includes('school_years')
  );
}

function jobSuffix(jobId: string): string {
  return jobId.split('-')[0] || jobId.slice(0, 8);
}

function buildFriendlyOriginalName(slug: string, receiptLineIndex: number, jobId: string, ext: string) {
  return `${slug}-receipt-${receiptLineIndex}-${jobSuffix(jobId)}-original.${ext}`;
}

async function verifyTurnstile(
  token: string,
  secretKey: string,
  ip: string | null,
): Promise<boolean> {
  const formData = new URLSearchParams();
  formData.append('secret', secretKey);
  formData.append('response', token);
  if (ip) formData.append('remoteip', ip);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: formData.toString(),
  });
  const outcome = (await res.json()) as {success: boolean};
  return outcome.success;
}

export async function action({request, context}: Route.ActionArgs) {
  try {
    const body = await request.json();

    const turnstileSecret = context.cloudflare.env.TURNSTILE_SECRET_KEY;
    const turnstileToken = (body as Record<string, unknown>).turnstileToken;
    if (!turnstileSecret || !turnstileToken || typeof turnstileToken !== 'string') {
      return Response.json({error: 'Verification failed'}, {status: 403});
    }

    const clientIp = request.headers.get('CF-Connecting-IP');
    const verified = await verifyTurnstile(turnstileToken, turnstileSecret, clientIp);
    if (!verified) {
      return Response.json({error: 'Verification failed. Please try again.'}, {status: 403});
    }

    const validationResult = submissionSchema.safeParse(body);
    if (!validationResult.success) {
      return Response.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten(),
        },
        {status: 400},
      );
    }

    const {requester, receipts, files, receiptUploads, budget} = validationResult.data;

    const env = context.cloudflare.env;
    const db = env.REIMBURSEMENT_DB;
    const r2 = env.R2_BUCKET;

    if (!db) {
      return Response.json(
        {error: 'Storage is not configured for this environment.'},
        {status: 503},
      );
    }
    if (!r2) {
      return Response.json(
        {error: 'File storage is not configured for this environment.'},
        {status: 503},
      );
    }

    // Look up every job referenced by the client and reject double-claims.
    const jobsById = new Map<string, ReceiptConversionJobRow>();
    const seenJobIds = new Set<string>();
    if (receiptUploads.length > 0) {
      for (const upload of receiptUploads) {
        if (seenJobIds.has(upload.jobId)) {
          return Response.json(
            {error: 'Duplicate receipt uploads were detected. Please re-upload your receipts.'},
            {status: 400},
          );
        }
        seenJobIds.add(upload.jobId);
      }

      const placeholders = receiptUploads.map(() => '?').join(',');
      const jobRows = await db
        .prepare(
          `SELECT id, status, original_key, original_filename, original_content_type, original_size,
                  converted_key, converted_filename, converted_size, submission_id
           FROM receipt_conversion_jobs WHERE id IN (${placeholders})`,
        )
        .bind(...receiptUploads.map((u) => u.jobId))
        .all<ReceiptConversionJobRow>();

      for (const row of jobRows.results ?? []) {
        jobsById.set(row.id, row);
      }

      for (const upload of receiptUploads) {
        const job = jobsById.get(upload.jobId);
        if (!job) {
          return Response.json(
            {error: 'One or more receipt uploads were not recognized. Please re-upload.'},
            {status: 400},
          );
        }
        if (job.submission_id) {
          return Response.json(
            {error: 'One or more attachments were already used in another submission.'},
            {status: 400},
          );
        }
      }

      // Ensure uploads still exist in R2 (staging originals may be deleted after conversion,
      // but the converted PDF should exist until submission attaches/moves it).
      for (const upload of receiptUploads) {
        const job = jobsById.get(upload.jobId);
        if (!job) continue;
        const originalHead = await r2.head(job.original_key);
        const convertedHead =
          job.status === 'complete' && job.converted_key
            ? await r2.head(job.converted_key)
            : null;
        if (!originalHead && !convertedHead) {
          return Response.json(
            {error: 'An uploaded file is missing or expired. Please re-upload your receipts.'},
            {status: 400},
          );
        }
      }
    }

    const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0);

    const submissionId = crypto.randomUUID();
    const submittedAt = new Date().toISOString();

    const receiptsWithBudget = receipts.map((receipt) => ({
      ...receipt,
      budgetAccount: receipt.budgetAccount || budget.primaryAccount,
    }));

    // Generate the form-summary PDF (independent of receipt conversions; safe to do up front).
    const pdfBuffer = await generatePDF({
      submission: {
        id: submissionId,
        submittedAt,
        totalAmount,
      },
      requester,
      receipts: receiptsWithBudget,
      budget,
    });

    const slug = slugifyName(requester.payableTo, submittedAt.slice(0, 10));
    const pdfFilename = buildPdfFilename(slug);
    const pdfKey = `submissions/${submissionId}/${pdfFilename}`;
    await r2.put(pdfKey, pdfBuffer, {
      httpMetadata: {contentType: 'application/pdf'},
    });

    // Copy each original from staging into the submission folder, building friendly names.
    // Keep staging objects until queue processing finishes, otherwise in-flight jobs can fail
    // trying to read `original_key`.
    const renamedOriginals: Array<{
      key: string;
      filename: string;
      contentType: string;
      size: number;
    }> = [];
    const completedJobConverteds: ConvertedJobData[] = [];

    for (const upload of receiptUploads) {
      const job = jobsById.get(upload.jobId);
      if (!job) continue;

      const ext = job.original_filename.split('.').pop() || 'bin';
      const friendlyOriginalName = buildFriendlyOriginalName(
        slug,
        upload.receiptLineIndex,
        job.id,
        ext,
      );
      const newOriginalKey = `submissions/${submissionId}/${friendlyOriginalName}`;

      const obj = await r2.get(job.original_key);
      if (obj) {
        await r2.put(newOriginalKey, await obj.arrayBuffer(), {
          httpMetadata: {contentType: job.original_content_type},
        });

        renamedOriginals.push({
          key: newOriginalKey,
          filename: friendlyOriginalName,
          contentType: job.original_content_type,
          size: job.original_size,
        });
      }

      // Stash the data we'll need to attach the converted PDF (immediately if already complete,
      // or later when the queue worker finishes the job).
      if (
        job.status === 'complete' &&
        job.converted_key &&
        job.converted_filename &&
        job.converted_size != null
      ) {
        completedJobConverteds.push({
          jobId: job.id,
          submission_id: submissionId,
          submission_slug: slug,
          receipt_line_index: upload.receiptLineIndex,
          original_content_type: job.original_content_type,
          converted_key: job.converted_key,
          converted_filename: job.converted_filename,
          converted_size: job.converted_size,
        });
      }
    }

    // Persist the submission, receipt entries, and the original-file attachment rows in one batch.
    const fileAttachmentInserts = renamedOriginals.map((file, i) =>
      db
        .prepare(
          `INSERT INTO file_attachments (id, submission_id, r2_key, original_filename, content_type, file_size, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          submissionId,
          file.key,
          file.filename,
          file.contentType,
          file.size,
          i,
        ),
    );

    // Atomically claim each referenced job for this submission before persisting rows.
    for (const upload of receiptUploads) {
      const claim = await db
        .prepare(
          `UPDATE receipt_conversion_jobs
           SET submission_id = ?, submission_slug = ?, receipt_line_index = ?, updated_at = datetime('now')
           WHERE id = ? AND submission_id IS NULL`,
        )
        .bind(submissionId, slug, upload.receiptLineIndex, upload.jobId)
        .run();

      if ((claim.meta?.changes ?? 0) !== 1) {
        await db
          .prepare(
            `UPDATE receipt_conversion_jobs
             SET submission_id = NULL, submission_slug = NULL, receipt_line_index = NULL, updated_at = datetime('now')
             WHERE submission_id = ?`,
          )
          .bind(submissionId)
          .run();
        return Response.json(
          {
            error:
              'One or more receipt uploads were claimed by another submission. Please re-upload your receipts and try again.',
          },
          {status: 409},
        );
      }
    }

    const schoolYearResolution = await resolveSchoolYearIdForNewSubmission(db);
    if (!schoolYearResolution.ok) {
      return schoolYearResolution.response;
    }
    const schoolYearId = schoolYearResolution.schoolYearId;

    await db.batch([
      db
        .prepare(
          `INSERT INTO submissions
            (id, requester_name, requester_email, requester_phone, requester_address,
             date_check_needed, status, total_amount, pdf_key, submitted_at, school_year_id)
           VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
        )
        .bind(
          submissionId,
          requester.payableTo,
          requester.email,
          requester.phone || null,
          requester.address || null,
          requester.dateCheckNeeded || null,
          totalAmount,
          pdfKey,
          submittedAt,
          schoolYearId,
        ),
      ...receiptsWithBudget.map((receipt, i) =>
        db
          .prepare(
            `INSERT INTO receipt_entries (id, submission_id, receipt_date, description, amount, category, vendor, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            crypto.randomUUID(),
            submissionId,
            receipt.date,
            receipt.description,
            receipt.amount,
            receipt.budgetAccount,
            receipt.placeOfPurchase || null,
            i,
          ),
      ),
      ...fileAttachmentInserts,
    ]);

    // Fast path: any conversions that already finished get their converted PDFs attached now.
    for (const job of completedJobConverteds) {
      try {
        await attachConvertedToSubmission(env, job);
      } catch (err) {
        console.error('[submit] attachConvertedToSubmission failed:', err);
      }
    }

    const pdfFileCount = files.filter((f) => f.contentType === 'application/pdf').length;
    console.log('Submission saved:', {
      id: submissionId,
      requester: requester.payableTo,
      totalAmount,
      receiptsCount: receipts.length,
      filesCount: renamedOriginals.length,
      pdfFileCount,
      pendingConversions: receiptUploads.length - completedJobConverteds.length,
    });

    // If every job was already terminal (complete or error) at submit, send the email now.
    // Otherwise, the queue consumer will dispatch it once the last conversion finishes.
    const claimed = await tryClaimEmailDispatch(db, submissionId);
    if (claimed) {
      try {
        const sent = await dispatchSubmissionEmail(env, submissionId);
        if (!sent) {
          await releaseEmailDispatchClaim(db, submissionId);
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        await releaseEmailDispatchClaim(db, submissionId);
      }
    } else {
      console.log('Email deferred until receipt conversions complete:', {id: submissionId});
    }

    return Response.json({
      success: true,
      submissionId,
      message: 'Submission received successfully.',
    });
  } catch (error) {
    console.error('Submission error:', error);
    if (isSchemaOutdatedError(error)) {
      return Response.json(
        {
          error:
            'Database schema is out of date. Please run the latest reimbursement migrations and try again.',
        },
        {status: 503},
      );
    }
    return Response.json({error: 'Failed to process submission'}, {status: 500});
  }
}
