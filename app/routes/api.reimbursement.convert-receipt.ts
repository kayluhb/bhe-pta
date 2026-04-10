import {
  ACCEPTED_TYPES,
  MAX_FILE_SIZE,
  extractReceiptData,
  generateReceiptPDF,
} from '~/lib/reimbursement/receipt';
import {requireTurnstile} from '~/lib/turnstile';
import type {Route} from './+types/api.reimbursement.convert-receipt';

export async function action({request, context}: Route.ActionArgs) {
  try {
    const denied = await requireTurnstile(request, context.cloudflare.env.TURNSTILE_SECRET_KEY);
    if (denied) return denied;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({error: 'No file provided'}, {status: 400});
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      return Response.json(
        {
          error: 'Invalid file type. Only JPEG, PNG, WebP, and PDF files are accepted.',
        },
        {status: 400},
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json({error: 'File too large. Maximum 10MB.'}, {status: 400});
    }

    const env = context.cloudflare.env;

    // Extract receipt data via Gemini
    const result = await extractReceiptData(file, env.GEMINI_API_KEY);
    if ('error' in result) {
      return Response.json({error: result.error}, {status: result.status});
    }
    const {receipt} = result;

    // Generate formatted PDF
    const payableTo = formData.get('payableTo') as string | null;
    const receiptNumber = formData.get('receiptNumber') as string | null;
    const pdfTitle = payableTo
      ? `${payableTo}: Receipt ${receiptNumber || '1'}`
      : 'Receipt Transcript';
    const pdfBuffer = generateReceiptPDF(receipt, pdfTitle);

    // Upload PDF and original to R2
    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const isPDF = file.type === 'application/pdf';
    const timestamp = Date.now();
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const pdfKey = `uploads/${timestamp}-${crypto.randomUUID()}-${sanitizedName}.pdf`;

    if (env.R2_BUCKET) {
      const ext = file.name.split('.').pop() || (isPDF ? 'pdf' : 'jpg');
      const originalKey = `uploads/${timestamp}-${crypto.randomUUID()}-${sanitizedName}.${ext}`;

      await Promise.all([
        env.R2_BUCKET.put(pdfKey, pdfBuffer, {
          httpMetadata: {contentType: 'application/pdf'},
        }),
        env.R2_BUCKET.put(originalKey, fileBytes, {
          httpMetadata: {contentType: file.type},
        }),
      ]);

      return Response.json({
        key: pdfKey,
        filename: `${sanitizedName}-converted.pdf`,
        contentType: 'application/pdf',
        size: pdfBuffer.length,
        original: {
          key: originalKey,
          filename: file.name,
          contentType: file.type,
          size: file.size,
        },
      });
    }

    console.log(
      `[Dev] Converted receipt PDF generated for: ${file.name} (${pdfBuffer.length} bytes)`,
    );

    return Response.json({
      key: pdfKey,
      filename: `${sanitizedName}-converted.pdf`,
      contentType: 'application/pdf',
      size: pdfBuffer.length,
    });
  } catch (error) {
    console.error('Receipt conversion error:', error);
    return Response.json(
      {error: 'Failed to process image. Please try uploading it directly.'},
      {status: 500},
    );
  }
}
