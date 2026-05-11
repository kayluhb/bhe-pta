import {
  FILE_ACCESS_TTL_SEC,
  resolveFilePreviewSigningSecret,
  signFileAccess,
} from '~/lib/reimbursement/file-url-signature';
import {ACCEPTED_TYPES, MAX_FILE_SIZE} from '~/lib/reimbursement/receipt';
import {
  issueReceiptUploadContinuationToken,
  verifyReceiptUploadContinuationToken,
} from '~/lib/reimbursement/receipt-upload-token';
import {requireTurnstile} from '~/lib/turnstile';
import type {Route} from './+types/api.reimbursement.convert-receipt';

function logConvertReceipt(payload: Record<string, unknown>) {
  console.log(`[convert-receipt] ${JSON.stringify(payload)}`);
}

export async function action({request, context}: Route.ActionArgs) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  try {
    const env = context.cloudflare.env;
    const continuationSecret = env.SESSION_SECRET || env.FILE_URL_SIGNING_SECRET;
    const continuation = request.headers.get('X-Receipt-Upload-Token');

    let authViaContinuation = false;
    if (continuation && continuationSecret) {
      authViaContinuation = await verifyReceiptUploadContinuationToken(
        continuation,
        continuationSecret,
      );
    }

    if (!authViaContinuation) {
      const denied = await requireTurnstile(request, env.TURNSTILE_SECRET_KEY);
      if (denied) {
        logConvertReceipt({requestId, outcome: 'turnstile_denied'});
        return denied;
      }
    } else {
      logConvertReceipt({requestId, outcome: 'auth_continuation_token'});
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      logConvertReceipt({requestId, outcome: 'reject', reason: 'no_file'});
      return Response.json({error: 'No file provided'}, {status: 400});
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      logConvertReceipt({
        requestId,
        outcome: 'reject',
        reason: 'bad_content_type',
        contentType: file.type,
        filename: file.name,
      });
      return Response.json(
        {
          error: 'Invalid file type. Only JPEG, PNG, WebP, and PDF files are accepted.',
        },
        {status: 400},
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      logConvertReceipt({
        requestId,
        outcome: 'reject',
        reason: 'too_large',
        declaredSize: file.size,
        filename: file.name,
      });
      return Response.json({error: 'File too large. Maximum 10MB.'}, {status: 400});
    }

    const payableTo = formData.get('payableTo') as string | null;
    const receiptNumber = formData.get('receiptNumber') as string | null;

    // Read once: Workers may not allow a second file.arrayBuffer().
    const fileBytes = new Uint8Array(await file.arrayBuffer());
    if (fileBytes.byteLength === 0) {
      logConvertReceipt({requestId, outcome: 'reject', reason: 'empty_body', filename: file.name});
      return Response.json({error: 'Uploaded file was empty.'}, {status: 400});
    }

    // Upload original immediately; queue worker will generate converted PDF.
    const db = env.REIMBURSEMENT_DB;
    if (!db) {
      logConvertReceipt({requestId, outcome: 'reject', reason: 'no_db'});
      return Response.json(
        {error: 'Storage is not configured for this environment.'},
        {status: 503},
      );
    }
    const timestamp = Date.now();
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9.-]/g, '_');

    if (!env.R2_BUCKET) {
      logConvertReceipt({requestId, outcome: 'reject', reason: 'no_r2_bucket'});
      console.error(
        '[convert-receipt] R2_BUCKET is not configured; cannot store original + converted',
      );
      return Response.json(
        {
          error: 'File storage is not available. Check that R2 is configured for this environment.',
        },
        {status: 503},
      );
    }

    const ext = file.name.split('.').pop() || 'bin';
    const originalKey = `uploads/${timestamp}-${crypto.randomUUID()}-${sanitizedName}.${ext}`;

    await env.R2_BUCKET.put(originalKey, fileBytes, {
      httpMetadata: {contentType: file.type},
    });
    const jobId = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO receipt_conversion_jobs
         (id, status, original_key, original_filename, original_content_type, original_size, receipt_number, payable_to)
         VALUES (?, 'queued', ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        jobId,
        originalKey,
        file.name,
        file.type,
        fileBytes.byteLength,
        receiptNumber?.trim() || null,
        payableTo?.trim() || null,
      )
      .run();

    const totalMs = Date.now() - startedAt;
    logConvertReceipt({
      requestId,
      outcome: 'queued',
      totalMs,
      jobId,
      originalKey,
      originalBytes: fileBytes.byteLength,
    });

    let receiptUploadToken: string | undefined;
    if (continuationSecret) {
      receiptUploadToken = await issueReceiptUploadContinuationToken(continuationSecret);
    }

    const signingSecret = resolveFilePreviewSigningSecret(env);
    let originalSignedPreview: {fileAccessExp: number; fileAccessSig: string} | undefined;
    if (signingSecret) {
      const fileAccessExp = Math.floor(Date.now() / 1000) + FILE_ACCESS_TTL_SEC;
      const fileAccessSig = await signFileAccess(originalKey, fileAccessExp, signingSecret);
      originalSignedPreview = {fileAccessExp, fileAccessSig};
    }

    return Response.json({
      jobId,
      receiptUploadToken,
      status: 'queued',
      original: {
        key: originalKey,
        filename: file.name,
        contentType: file.type,
        size: fileBytes.byteLength,
        ...(originalSignedPreview ?? {}),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logConvertReceipt({
      requestId,
      outcome: 'exception',
      error: message,
      totalMs: Date.now() - startedAt,
    });
    console.error('[convert-receipt] Receipt conversion error:', error);
    return Response.json(
      {error: 'Failed to process image. Please try uploading it directly.'},
      {status: 500},
    );
  }
}
