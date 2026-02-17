import type { Route } from "./+types/api.reimbursement.ocr";
import jsPDF from "jspdf";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function action({ request, context }: Route.ActionArgs) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (!IMAGE_TYPES.includes(file.type)) {
      return Response.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP images are accepted for OCR." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: "File too large. Maximum 10MB." }, { status: 400 });
    }

    const env = context.cloudflare.env;

    // Step 1: Extract text using Workers AI vision model
    const imageBytes = new Uint8Array(await file.arrayBuffer());

    // Encode image as base64 data URL for the messages content
    let binary = "";
    for (let i = 0; i < imageBytes.length; i++) {
      binary += String.fromCharCode(imageBytes[i]);
    }
    const base64Image = btoa(binary);
    const dataUrl = `data:${file.type};base64,${base64Image}`;

    const aiResponse = await env.AI.run("@cf/meta/llama-3.2-11b-vision-instruct", {
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
            {
              type: "text",
              text: "Transcribe all visible text in this image exactly as it appears. Include all numbers, dates, and amounts. Output only the transcribed text, nothing else.",
            },
          ],
        },
      ],
      max_tokens: 2048,
    });

    const extractedText = aiResponse.response?.trim();

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
    doc.text("Receipt OCR Transcript", 105, 20, { align: "center" });

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

    // Step 3: Upload PDF to R2
    const timestamp = Date.now();
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `uploads/${timestamp}-${crypto.randomUUID()}-${sanitizedName}.pdf`;

    if (env.R2_BUCKET) {
      await env.R2_BUCKET.put(key, pdfBuffer, {
        httpMetadata: { contentType: "application/pdf" },
      });
    } else {
      console.log(`[Dev] OCR PDF generated for: ${file.name} (${pdfBuffer.length} bytes)`);
    }

    // Step 4: Return file metadata
    return Response.json({
      key,
      filename: `${sanitizedName}-ocr.pdf`,
      contentType: "application/pdf",
      size: pdfBuffer.length,
    });
  } catch (error) {
    console.error("OCR error:", error);
    return Response.json(
      { error: "Failed to process image. Please try uploading it directly." },
      { status: 500 }
    );
  }
}
