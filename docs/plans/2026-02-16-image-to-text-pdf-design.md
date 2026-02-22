# Image-to-Text PDF Conversion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When a user uploads an image in the reimbursement form, use Workers AI to OCR the image and store a text-only PDF in R2 instead of the original image.

**Architecture:** Client detects image uploads and sends them to a new `/api/reimbursement/ocr` endpoint. The endpoint uses Workers AI (Llama 3.2 Vision) to extract text, renders it into a PDF with jsPDF, uploads the PDF to R2, and returns file metadata. The client treats the result identically to a regular file upload.

**Tech Stack:** Workers AI (`@cf/meta/llama-3.2-11b-vision-instruct`), jsPDF, Cloudflare R2, React Router 7

---

### Task 1: Add Workers AI binding

**Files:**
- Modify: `wrangler.jsonc`
- Modify: `workers/app.ts:6-18`

**Step 1: Add AI binding to wrangler.jsonc**

Add after the `r2_buckets` block:

```jsonc
"ai": {
  "binding": "AI"
}
```

**Step 2: Add AI to the Env interface in `workers/app.ts`**

Add `AI: Ai;` to the `Env` interface (after `CLOUDFLARE_ACCOUNT_ID`):

```typescript
interface Env {
  BHE_NEWSLETTERS: KVNamespace;
  BHE_PTA_NEWSLETTERS: KVNamespace;
  BHE_CALENDAR: KVNamespace;
  MAILCHIMP_API_KEY: string;
  REIMBURSEMENT_DB: D1Database;
  R2_BUCKET: R2Bucket;
  RESEND_API_KEY: string;
  NOTIFICATION_EMAIL: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  AI: Ai;
}
```

**Step 3: Regenerate Cloudflare types**

Run: `npm run cf-typegen`
Expected: `worker-configuration.d.ts` is updated with the `AI` binding type.

**Step 4: Commit**

```bash
git add wrangler.jsonc workers/app.ts worker-configuration.d.ts
git commit -m "feat: add Workers AI binding for OCR"
```

---

### Task 2: Create the OCR API route

**Files:**
- Create: `app/routes/api.reimbursement.ocr.ts`
- Modify: `app/routes.ts`

**Step 1: Register the route in `app/routes.ts`**

Add after the `api/reimbursement/pdf` line:

```typescript
route("api/reimbursement/ocr", "./routes/api.reimbursement.ocr.ts"),
```

**Step 2: Create the OCR route**

Create `app/routes/api.reimbursement.ocr.ts`:

```typescript
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

    const aiResponse = await env.AI.run("@cf/meta/llama-3.2-11b-vision-instruct", {
      messages: [
        {
          role: "user",
          content: "Transcribe all visible text in this image exactly as it appears. Include all numbers, dates, and amounts. Output only the transcribed text, nothing else.",
        },
      ],
      image: [...imageBytes],
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
    const lines = doc.splitTextToSize(extractedText, 170);
    doc.text(lines, 20, 36);

    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(128);
    doc.text("Automatically transcribed from uploaded image.", 105, 285, { align: "center" });

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
```

**Step 3: Verify types**

Run: `npm run typecheck`
Expected: No type errors.

**Step 4: Commit**

```bash
git add app/routes/api.reimbursement.ocr.ts app/routes.ts
git commit -m "feat: add OCR API route for image-to-text PDF conversion"
```

---

### Task 3: Route image uploads through OCR endpoint

**Files:**
- Modify: `app/hooks/useFileUpload.ts`

**Step 1: Update `useFileUpload` to detect images and call OCR**

The current flow is: presign → upload to R2 via XHR. For images, the new flow is: send image as FormData to `/api/reimbursement/ocr` → get back file metadata.

Replace the `uploadFile` callback in `app/hooks/useFileUpload.ts`:

```typescript
const uploadFile = useCallback(async (file: File): Promise<FileData | null> => {
  const id = crypto.randomUUID();

  setUploads((prev) => {
    const next = new Map(prev);
    next.set(id, { id, filename: file.name, progress: 0, status: 'pending' });
    return next;
  });

  try {
    const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);

    if (isImage) {
      // Image: send to OCR endpoint for text extraction + PDF conversion
      setUploads((prev) => {
        const next = new Map(prev);
        next.set(id, { id, filename: file.name, progress: 30, status: 'uploading' });
        return next;
      });

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/reimbursement/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || 'OCR processing failed');
      }

      const result = (await response.json()) as FileData;

      setUploads((prev) => {
        const next = new Map(prev);
        next.set(id, { id, filename: file.name, progress: 100, status: 'complete' });
        return next;
      });

      return result;
    }

    // PDF: use existing presign + direct upload flow
    const presignResponse = await fetch('/api/reimbursement/upload-presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        fileSize: file.size,
      }),
    });

    if (!presignResponse.ok) {
      const errorData = (await presignResponse.json()) as { error?: string };
      throw new Error(errorData.error || 'Failed to get upload URL');
    }

    const { uploadUrl, key } = (await presignResponse.json()) as { uploadUrl: string; key: string };

    setUploads((prev) => {
      const next = new Map(prev);
      next.set(id, { id, filename: file.name, progress: 0, status: 'uploading' });
      return next;
    });

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploads((prev) => {
            const next = new Map(prev);
            next.set(id, { id, filename: file.name, progress, status: 'uploading' });
            return next;
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Upload failed')));

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });

    setUploads((prev) => {
      const next = new Map(prev);
      next.set(id, { id, filename: file.name, progress: 100, status: 'complete' });
      return next;
    });

    return {
      key,
      filename: file.name,
      contentType: file.type,
      size: file.size,
    };
  } catch (error) {
    setUploads((prev) => {
      const next = new Map(prev);
      next.set(id, {
        id,
        filename: file.name,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      });
      return next;
    });
    return null;
  }
}, []);
```

**Step 2: Verify types**

Run: `npm run typecheck`
Expected: No type errors.

**Step 3: Commit**

```bash
git add app/hooks/useFileUpload.ts
git commit -m "feat: route image uploads through OCR endpoint"
```

---

### Task 4: Update upload progress UI for OCR

**Files:**
- Modify: `app/components/reimbursement/steps/FileUploads.tsx`

**Step 1: Add OCR processing indicator**

In the upload progress section of `FileUploads.tsx`, update the status text to show "Processing..." for image OCR uploads (the progress will jump from 30% to 100% rather than streaming). Update the progress display around line 73:

```typescript
{upload.status === 'uploading' && upload.progress <= 30 && 'Processing image...'}
{upload.status === 'uploading' && upload.progress > 30 && `${upload.progress}%`}
```

Replace the existing line:
```typescript
{upload.status === 'uploading' && `${upload.progress}%`}
```

**Step 2: Verify dev server renders correctly**

Run: `npm run dev`
Navigate to `/reimbursement`, step through to the file upload step, and confirm UI renders.

**Step 3: Commit**

```bash
git add app/components/reimbursement/steps/FileUploads.tsx
git commit -m "feat: show OCR processing indicator during image upload"
```

---

### Task 5: Manual integration test

**Step 1: Run local dev server**

Run: `npm run dev`

**Step 2: Test image upload flow**

1. Navigate to `/reimbursement`
2. Fill out required fields to reach the file upload step
3. Upload a JPEG/PNG image of a receipt
4. Verify: progress shows "Processing image..."
5. Verify: file appears in list with `.pdf` extension
6. Verify: no console errors

**Step 3: Test PDF upload flow (unchanged)**

1. Upload a PDF file
2. Verify: existing presign+upload flow works as before
3. Verify: file appears with original `.pdf` name

**Step 4: Test error handling**

1. Note: In dev without Workers AI binding, the OCR endpoint will fail
2. Verify: error message appears in UI

**Step 5: Typecheck**

Run: `npm run typecheck`
Expected: No errors.
