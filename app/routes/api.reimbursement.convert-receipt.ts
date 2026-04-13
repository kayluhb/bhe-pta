import {
  ACCEPTED_TYPES,
  MAX_FILE_SIZE,
  extractReceiptData,
  generateReceiptPDF,
  parseSubmissionReceiptLineForPdf,
  receiptFieldString,
  type ReceiptData,
} from '~/lib/reimbursement/receipt';
import {FILE_ACCESS_TTL_SEC, signFileAccess} from '~/lib/reimbursement/file-url-signature';
import {requireTurnstile} from '~/lib/turnstile';
import type {Route} from './+types/api.reimbursement.convert-receipt';

function logConvertReceipt(payload: Record<string, unknown>) {
  console.log(`[convert-receipt] ${JSON.stringify(payload)}`);
}

function receiptExtractSummary(receipt: ReceiptData) {
  const raw = receiptFieldString(receipt.raw_transcript);
  return {
    vendor: receiptFieldString(receipt.vendor_name) ? 'yes' : 'no',
    lineItems: receipt.line_items?.length ?? 0,
    hasTotal: receiptFieldString(receipt.total).length > 0,
    hasSubtotal: receiptFieldString(receipt.subtotal).length > 0,
    hasShipping: receiptFieldString(receipt.shipping).length > 0,
    hasTip: receiptFieldString(receipt.tip).length > 0,
    hasNotes: receiptFieldString(receipt.notes).length > 0,
    hasRawTranscript: raw.length > 0,
    rawTranscriptChars: raw.length,
  };
}

export async function action({request, context}: Route.ActionArgs) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  try {
    const denied = await requireTurnstile(request, context.cloudflare.env.TURNSTILE_SECRET_KEY);
    if (denied) {
      logConvertReceipt({requestId, outcome: 'turnstile_denied'});
      return denied;
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

    const env = context.cloudflare.env;

    const payableTo = formData.get('payableTo') as string | null;
    const receiptNumber = formData.get('receiptNumber') as string | null;

    // Read once: Workers may not allow a second file.arrayBuffer(); reuse for Gemini + R2 original.
    const fileBytes = new Uint8Array(await file.arrayBuffer());
    if (fileBytes.byteLength === 0) {
      logConvertReceipt({requestId, outcome: 'reject', reason: 'empty_body', filename: file.name});
      return Response.json({error: 'Uploaded file was empty.'}, {status: 400});
    }

    logConvertReceipt({
      requestId,
      phase: 'start',
      filename: file.name,
      contentType: file.type,
      declaredSize: file.size,
      byteLength: fileBytes.byteLength,
      hasPayableTo: Boolean(payableTo?.trim()),
      receiptNumber: receiptNumber || undefined,
    });

    // Extract receipt data via Gemini
    const extractStarted = Date.now();
    const result = await extractReceiptData(fileBytes, file.type, env.GEMINI_API_KEY);
    if ('error' in result) {
      logConvertReceipt({
        requestId,
        outcome: 'extract_failed',
        status: result.status,
        error: result.error,
        extractMs: Date.now() - extractStarted,
      });
      return Response.json({error: result.error}, {status: result.status});
    }
    const {receipt} = result;

    logConvertReceipt({
      requestId,
      phase: 'extracted',
      extractMs: Date.now() - extractStarted,
      ...receiptExtractSummary(receipt),
    });

    // Generate formatted PDF
    const lineForPdf = parseSubmissionReceiptLineForPdf(receiptNumber);
    const titleReceiptLabel = lineForPdf ?? (receiptNumber?.trim() || '1');
    const pdfTitle = payableTo
      ? `${payableTo}: Receipt ${titleReceiptLabel}`
      : 'Receipt Transcript';
    const pdfBuffer = generateReceiptPDF(receipt, pdfTitle, {
      submissionReceiptLine: lineForPdf,
    });

    // Upload PDF and original to R2 — both are required so treasurers always have the source file
    // if the generated PDF/OCR is wrong. (Original bytes are `fileBytes` from the single read above.)
    const isPDF = file.type === 'application/pdf';
    const timestamp = Date.now();
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const pdfKey = `uploads/${timestamp}-${crypto.randomUUID()}-${sanitizedName}.pdf`;

    if (!env.R2_BUCKET) {
      logConvertReceipt({requestId, outcome: 'reject', reason: 'no_r2_bucket'});
      console.error('[convert-receipt] R2_BUCKET is not configured; cannot store original + converted');
      return Response.json(
        {
          error:
            'File storage is not available. Check that R2 is configured for this environment.',
        },
        {status: 503},
      );
    }

    const ext = file.name.split('.').pop() || (isPDF ? 'pdf' : 'jpg');
    const originalKey = `uploads/${timestamp}-${crypto.randomUUID()}-${sanitizedName}.${ext}`;

    await env.R2_BUCKET.put(originalKey, fileBytes, {
      httpMetadata: {contentType: file.type},
    });
    await env.R2_BUCKET.put(pdfKey, pdfBuffer, {
      httpMetadata: {contentType: 'application/pdf'},
    });

    const signingSecret = env.FILE_URL_SIGNING_SECRET;
    if (!signingSecret) {
      logConvertReceipt({requestId, outcome: 'reject', reason: 'no_file_url_signing_secret'});
      console.error('[convert-receipt] FILE_URL_SIGNING_SECRET is not configured');
      return Response.json(
        {error: 'File preview signing is not configured for this environment.'},
        {status: 503},
      );
    }

    const fileAccessExp = Math.floor(Date.now() / 1000) + FILE_ACCESS_TTL_SEC;
    const [pdfSig, originalSig] = await Promise.all([
      signFileAccess(pdfKey, fileAccessExp, signingSecret),
      signFileAccess(originalKey, fileAccessExp, signingSecret),
    ]);

    const totalMs = Date.now() - startedAt;
    logConvertReceipt({
      requestId,
      outcome: 'ok',
      totalMs,
      pdfKey,
      originalKey,
      convertedPdfBytes: pdfBuffer.length,
      originalBytes: fileBytes.byteLength,
      responseFilename: `${sanitizedName}-converted.pdf`,
    });

    const originalMeta = {
      key: originalKey,
      filename: file.name,
      contentType: file.type,
      size: fileBytes.byteLength,
      fileAccessExp,
      fileAccessSig: originalSig,
    };

    return Response.json({
      key: pdfKey,
      filename: `${sanitizedName}-converted.pdf`,
      contentType: 'application/pdf',
      size: pdfBuffer.length,
      fileAccessExp,
      fileAccessSig: pdfSig,
      original: originalMeta,
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
