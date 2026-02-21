import type { Route } from "./+types/api.reimbursement.convert-receipt";
import jsPDF from "jspdf";
import { requireTurnstile } from "~/lib/turnstile";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function action({ request, context }: Route.ActionArgs) {
  try {
    const denied = await requireTurnstile(request, context.cloudflare.env.TURNSTILE_SECRET_KEY);
    if (denied) return denied;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (!IMAGE_TYPES.includes(file.type)) {
      return Response.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP images are accepted." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: "File too large. Maximum 10MB." }, { status: 400 });
    }

    const env = context.cloudflare.env;

    // Step 1: Extract text using Gemini vision model
    const imageBytes = new Uint8Array(await file.arrayBuffer());

    // Encode image as base64 for Gemini API
    let binary = "";
    for (let i = 0; i < imageBytes.length; i++) {
      binary += String.fromCharCode(imageBytes[i]);
    }
    const base64Image = btoa(binary);

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: file.type,
                    data: base64Image,
                  },
                },
                {
                  text: "Transcribe all visible text in this receipt image exactly as it appears. Include all numbers, dates, amounts, item names, and totals. Output only the transcribed text, nothing else.",
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errBody = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errBody);
      return Response.json(
        { error: "Failed to process image with Gemini. Please try uploading it directly." },
        { status: 502 }
      );
    }

    const geminiResult = (await geminiResponse.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const extractedText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!extractedText) {
      return Response.json(
        { error: "Could not extract text from image. Please upload the file directly." },
        { status: 422 }
      );
    }

    // Step 2: Generate text-only PDF
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Converted Receipt Transcript", 105, 20, { align: "center" });

    doc.setDrawColor(200);
    doc.line(20, 26, 190, 26);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
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
    doc.setFont("helvetica", "italic");
    doc.setTextColor(128);
    doc.text("Automatically transcribed from uploaded image.", 105, pageHeight - 10, { align: "center" });

    const pdfBuffer = new Uint8Array(doc.output("arraybuffer"));

    // Step 3: Upload PDF and original image to R2
    const timestamp = Date.now();
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const ext = file.name.split(".").pop() || "jpg";
    const pdfKey = `uploads/${timestamp}-${crypto.randomUUID()}-${sanitizedName}.pdf`;
    const originalKey = `uploads/${timestamp}-${crypto.randomUUID()}-${sanitizedName}.${ext}`;

    if (env.R2_BUCKET) {
      await Promise.all([
        env.R2_BUCKET.put(pdfKey, pdfBuffer, {
          httpMetadata: { contentType: "application/pdf" },
        }),
        env.R2_BUCKET.put(originalKey, imageBytes, {
          httpMetadata: { contentType: file.type },
        }),
      ]);
    } else {
      console.log(`[Dev] Converted receipt PDF generated for: ${file.name} (${pdfBuffer.length} bytes)`);
    }

    // Step 4: Return file metadata for both PDF and original
    return Response.json({
      key: pdfKey,
      filename: `${sanitizedName}-converted.pdf`,
      contentType: "application/pdf",
      size: pdfBuffer.length,
      original: {
        key: originalKey,
        filename: file.name,
        contentType: file.type,
        size: file.size,
      },
    });
  } catch (error) {
    console.error("Receipt conversion error:", error);
    return Response.json(
      { error: "Failed to process image. Please try uploading it directly." },
      { status: 500 }
    );
  }
}
