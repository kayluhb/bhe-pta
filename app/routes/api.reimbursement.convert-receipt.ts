import jsPDF from 'jspdf';
import {requireTurnstile} from '~/lib/turnstile';
import type {Route} from './+types/api.reimbursement.convert-receipt';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

    // Step 1: Extract text using Gemini vision model
    const fileBytes = new Uint8Array(await file.arrayBuffer());

    // Encode file as base64 for Gemini API
    let binary = '';
    for (let i = 0; i < fileBytes.length; i++) {
      binary += String.fromCharCode(fileBytes[i]);
    }
    const base64Data = btoa(binary);

    const isPDF = file.type === 'application/pdf';
    const prompt = isPDF
      ? 'Transcribe all visible text in this receipt PDF exactly as it appears. Include all numbers, dates, amounts, item names, and totals. Output only the transcribed text, nothing else.'
      : 'Transcribe all visible text in this receipt image exactly as it appears. Include all numbers, dates, amounts, item names, and totals. Output only the transcribed text, nothing else.';

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: file.type,
                    data: base64Data,
                  },
                },
                {text: prompt},
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 2048,
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errBody = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errBody);
      return Response.json(
        {
          error: 'Failed to process image with Gemini. Please try uploading it directly.',
        },
        {status: 502},
      );
    }

    const geminiResult = (await geminiResponse.json()) as {
      candidates?: Array<{
        content?: {parts?: Array<{text?: string}>};
      }>;
    };

    const extractedText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!extractedText) {
      return Response.json(
        {
          error: 'Could not extract text from image. Please upload the file directly.',
        },
        {status: 422},
      );
    }

    // Step 2: Generate text-only PDF
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Converted Receipt Transcript', 105, 20, {align: 'center'});

    doc.setDrawColor(200);
    doc.line(20, 26, 190, 26);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(extractedText, 170) as string[];
    const lineHeight = 5;
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerY = pageHeight - 15;
    let currentY = 36;

    for (const line of lines) {
      if (currentY + lineHeight > footerY) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(line, 20, currentY);
      currentY += lineHeight;
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128);
    doc.text('Automatically transcribed from uploaded image.', 105, pageHeight - 10, {
      align: 'center',
    });

    const pdfBuffer = new Uint8Array(doc.output('arraybuffer'));

    // Step 3: Upload PDF and original to R2
    const timestamp = Date.now();
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const pdfKey = `uploads/${timestamp}-${crypto.randomUUID()}-${sanitizedName}.pdf`;

    if (env.R2_BUCKET) {
      const uploads: Promise<R2Object>[] = [
        env.R2_BUCKET.put(pdfKey, pdfBuffer, {
          httpMetadata: {contentType: 'application/pdf'},
        }),
      ];

      // Store original file separately only if it's not already a PDF
      let originalKey: string | undefined;
      if (!isPDF) {
        const ext = file.name.split('.').pop() || 'jpg';
        originalKey = `uploads/${timestamp}-${crypto.randomUUID()}-${sanitizedName}.${ext}`;
        uploads.push(
          env.R2_BUCKET.put(originalKey, fileBytes, {
            httpMetadata: {contentType: file.type},
          }),
        );
      }

      await Promise.all(uploads);

      return Response.json({
        key: pdfKey,
        filename: `${sanitizedName}-converted.pdf`,
        contentType: 'application/pdf',
        size: pdfBuffer.length,
        ...(originalKey
          ? {
              original: {
                key: originalKey,
                filename: file.name,
                contentType: file.type,
                size: file.size,
              },
            }
          : {}),
      });
    }

    console.log(
      `[Dev] Converted receipt PDF generated for: ${file.name} (${pdfBuffer.length} bytes)`,
    );

    // Step 4: Return file metadata
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
