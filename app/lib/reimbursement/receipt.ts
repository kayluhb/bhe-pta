import jsPDF from 'jspdf';

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface ReceiptData {
  vendor_name?: string;
  vendor_address?: string;
  vendor_phone?: string;
  document_type?: string;
  document_number?: string;
  date?: string;
  due_date?: string;
  bill_to?: string;
  line_items?: Array<{
    description?: string;
    qty?: string;
    unit_price?: string;
    total?: string;
  }>;
  /** Sum of product/service lines only — exclude shipping, tax, tips. */
  subtotal?: string;
  /** Shipping, handling, delivery fee (one amount if combined, e.g. Amazon). */
  shipping?: string;
  tip?: string;
  /** When shown (e.g. "Total before tax" on e-commerce summaries). */
  total_before_tax?: string;
  tax?: string;
  total?: string;
  notes?: string;
  /**
   * Every line of visible text in reading order (items, prices, order IDs, footnotes).
   * Used when structured fields are incomplete so the PDF is still useful for treasurers.
   */
  raw_transcript?: string;
}

/**
 * Gemini JSON may return numbers for currency fields; JSON.parse keeps them as numbers.
 * Coerce to a trimmed string for checks and PDF text.
 */
export function receiptFieldString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'yes' : '';
  return String(value).trim();
}

function bytesToBase64(fileBytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < fileBytes.length; i++) {
    binary += String.fromCharCode(fileBytes[i]);
  }
  return btoa(binary);
}

type GeminiOk = {ok: true; text: string};
type GeminiErr = {ok: false; error: string; status: number};

/**
 * Single multimodal Gemini call (image or PDF inline). Retries 503/429 per model.
 */
async function geminiMultimodal(
  apiKey: string,
  mimeType: string,
  base64Data: string,
  prompt: string,
  maxOutputTokens: number,
): Promise<GeminiOk | GeminiErr> {
  const geminiBody = JSON.stringify({
    contents: [
      {
        parts: [{inline_data: {mime_type: mimeType, data: base64Data}}, {text: prompt}],
      },
    ],
    generationConfig: {maxOutputTokens},
  });

  const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
  let geminiResponse: Response | null = null;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: geminiBody,
        },
      );

      if (geminiResponse.ok || (geminiResponse.status !== 503 && geminiResponse.status !== 429)) {
        break;
      }

      console.warn(`Gemini ${model} returned ${geminiResponse.status}, retrying...`);
      if (attempt < 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (geminiResponse?.ok) break;
    console.warn(`Gemini ${model} unavailable, trying next model...`);
  }

  if (!geminiResponse?.ok) {
    const errBody = await geminiResponse?.text();
    console.error('Gemini API error:', geminiResponse?.status, errBody);
    return {ok: false, error: 'Failed to process file with AI.', status: 502};
  }

  const geminiResult = (await geminiResponse?.json()) as {
    candidates?: Array<{content?: {parts?: Array<{text?: string; thought?: boolean}>}}>;
  };

  const parts = geminiResult.candidates?.[0]?.content?.parts ?? [];
  let rawText: string | undefined;
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i].text && !parts[i].thought) {
      rawText = parts[i].text?.trim();
      break;
    }
  }
  if (!rawText) {
    rawText = parts.find((p) => p.text)?.text?.trim();
  }
  if (!rawText) {
    return {ok: false, error: 'Could not extract data from file.', status: 422};
  }

  return {ok: true, text: rawText};
}

function stripMarkdownCodeFence(text: string): string {
  let t = text.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```[a-z0-9]*\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  }
  return t.trim();
}

/** Large PDFs often get thin JSON (date + order #) with no raw_transcript — run a plain-text pass. */
function needsPlainTranscriptFallback(receipt: ReceiptData, fileBytes: Uint8Array): boolean {
  if (fileBytes.byteLength < 6_000) return false;
  const rawLen = receiptFieldString(receipt.raw_transcript).length;
  if (rawLen >= 1_000) return false;
  const hasItems = (receipt.line_items?.length ?? 0) > 0;
  const hasTotal = receiptFieldString(receipt.total).length > 0;
  if (hasItems && hasTotal && rawLen >= 400) return false;
  return !hasItems || !hasTotal || rawLen < 400;
}

/**
 * Calls Gemini to extract structured receipt data from an image or PDF.
 * Retries on 503/429 with exponential backoff.
 *
 * Pass the same `fileBytes` you will store in R2. In Cloudflare Workers, a `File` from
 * `FormData` may not be readable twice — the second `arrayBuffer()` can be empty, which
 * produced blank originals while OCR still worked from the first read.
 */
export async function extractReceiptData(
  fileBytes: Uint8Array,
  mimeType: string,
  apiKey: string,
): Promise<{receipt: ReceiptData} | {error: string; status: number}> {
  const base64Data = bytesToBase64(fileBytes);
  const isPDF = mimeType === 'application/pdf';

  const structuredPrompt = `Extract data from this ${isPDF ? 'PDF document (read every page, in order)' : 'image'}.

Return a single JSON object. No markdown code fences. Escape quotes inside strings.

Required field:
- "raw_transcript": string — ALL visible text in natural reading order (top to bottom; for PDFs, page 1 then page 2, etc.). Use newline characters between lines. Include headers, store name, order/invoice numbers (e.g. Amazon-style 123-4567890-1234567), every product line with prices, quantity, shipping, tax, discounts, and grand total. If the layout is tables or columns, still flatten into readable lines. This field must be long enough that someone could approve the reimbursement from it alone; do not leave it empty if any text is visible.

Also fill when possible (omit keys only if absent):
- "vendor_name", "vendor_address", "vendor_phone"
- "document_type", "document_number", "date", "due_date", "bill_to"
- "line_items": [{"description","qty","unit_price","total"}] — one entry per distinct product/service row
- "subtotal" — sum of line items only (e-commerce: "Item(s) subtotal" / merchandise subtotal), NOT shipping or tax
- "shipping" — shipping, handling, and/or delivery fees as one amount when shown together (e.g. "Shipping & Handling: $6.54"); include delivery/service fees here if not a separate line item
- "tip" — gratuity or service tip when present
- "total_before_tax" — when the receipt shows it (e.g. Amazon "Total before tax" after shipping)
- "tax" — sales or estimated tax
- "total" — grand total / amount paid
- "notes" — short non-dollar text (delivery instructions, return policy). Do not repeat shipping, tip, or tax amounts here if they are already in the fields above.

E-commerce (Amazon, Walmart, Target, DoorDash, etc.): map the order summary faithfully — item subtotal → subtotal; shipping & handling → shipping; tips → tip; grand total → total. Structured dollar fields should reconcile to the same final total as the document.`;

  const structured = await geminiMultimodal(apiKey, mimeType, base64Data, structuredPrompt, 8192);
  if (!structured.ok) {
    return {error: structured.error, status: structured.status};
  }

  let receipt = parseReceiptJSON(structured.text);

  if (needsPlainTranscriptFallback(receipt, fileBytes)) {
    const plainPrompt = `This is a receipt, invoice, or order confirmation (${isPDF ? 'PDF — read every page in order' : 'image'}).

Output ONLY plain text. Do not use JSON or markdown.

Transcribe every visible word in natural reading order (top to bottom). Include:
- Store or seller name, addresses if shown
- Order / invoice / confirmation numbers
- Every product or service line with quantities and prices
- Shipping, tax, discounts, gift cards, and the final amount paid

Use blank lines between sections. If text is in columns or a table, read row by row so a treasurer can follow it.`;

    const plain = await geminiMultimodal(apiKey, mimeType, base64Data, plainPrompt, 8192);
    if (plain.ok) {
      const cleaned = stripMarkdownCodeFence(plain.text);
      const prevLen = receiptFieldString(receipt.raw_transcript).length;
      if (cleaned.length > prevLen) {
        receipt = {...receipt, raw_transcript: cleaned};
        console.log(
          `[extractReceiptData] ${JSON.stringify({
            event: 'plain_transcript_fallback',
            chars: cleaned.length,
            fileBytes: fileBytes.byteLength,
          })}`,
        );
      }
    }
  }

  return {receipt};
}

/** Best-effort unescape for regex-extracted JSON string fragments (e.g. truncated responses). */
function unescapeJsonStringFragment(s: string): string {
  return s
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function parseReceiptJSON(rawText: string): ReceiptData {
  try {
    let cleaned = rawText
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/, '')
      .trim();
    if (!cleaned.startsWith('{')) {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) cleaned = match[0];
    }
    return JSON.parse(cleaned) as ReceiptData;
  } catch {
    // Fallback: extract partial data from truncated JSON
    const extracted: ReceiptData = {};
    const fieldPatterns: Array<[keyof ReceiptData, RegExp]> = [
      ['vendor_name', /"vendor_name"\s*:\s*"([^"]*)"/],
      ['vendor_address', /"vendor_address"\s*:\s*"([^"]*)"/],
      ['vendor_phone', /"vendor_phone"\s*:\s*"([^"]*)"/],
      ['document_type', /"document_type"\s*:\s*"([^"]*)"/],
      ['document_number', /"document_number"\s*:\s*"([^"]*)"/],
      ['date', /"date"\s*:\s*"([^"]*)"/],
      ['due_date', /"due_date"\s*:\s*"([^"]*)"/],
      ['bill_to', /"bill_to"\s*:\s*"([^"]*)"/],
      ['subtotal', /"subtotal"\s*:\s*"([^"]*)"/],
      ['shipping', /"shipping"\s*:\s*"([^"]*)"/],
      ['tip', /"tip"\s*:\s*"([^"]*)"/],
      ['total_before_tax', /"total_before_tax"\s*:\s*"([^"]*)"/],
      ['tax', /"tax"\s*:\s*"([^"]*)"/],
      ['total', /"total"\s*:\s*"([^"]*)"/],
      ['notes', /"notes"\s*:\s*"([^"]*)"/],
      [
        'raw_transcript',
        /"raw_transcript"\s*:\s*"((?:[^"\\]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*)"/,
      ],
    ];
    for (const [field, pattern] of fieldPatterns) {
      const match = rawText.match(pattern);
      if (match) {
        const value = field === 'raw_transcript' ? unescapeJsonStringFragment(match[1]) : match[1];
        (extracted as Record<string, string>)[field] = value;
      }
    }

    const itemsMatch = rawText.match(/"line_items"\s*:\s*\[([\s\S]*?)(?:\]|$)/);
    if (itemsMatch) {
      const items: ReceiptData['line_items'] = [];
      const itemPattern = /\{[^}]*"description"\s*:\s*"([^"]*)"[^}]*\}/g;
      const itemsBlock = itemsMatch[1];
      let itemMatch: RegExpExecArray | null = itemPattern.exec(itemsBlock);
      while (itemMatch !== null) {
        const itemStr = itemMatch[0];
        items.push({
          description: itemMatch[1],
          qty: itemStr.match(/"qty"\s*:\s*"([^"]*)"/)?.[1],
          unit_price: itemStr.match(/"unit_price"\s*:\s*"([^"]*)"/)?.[1],
          total: itemStr.match(/"total"\s*:\s*"([^"]*)"/)?.[1],
        });
        itemMatch = itemPattern.exec(itemsBlock);
      }
      if (items.length > 0) extracted.line_items = items;
    }

    return Object.keys(extracted).length > 0 ? extracted : {};
  }
}

/**
 * jsPDF draws each string line at y, y+lh, … but does not return the final y.
 * We split on newlines and wrap to maxWidth so callers can advance y per line.
 */
function wrapPdfTextLines(doc: jsPDF, text: string, maxWidth: number): string[] {
  const t = text.trim();
  if (!t) return [];
  return t.split(/\r?\n/).flatMap((para) => {
    const p = para.trim();
    if (!p) return [];
    return doc.splitTextToSize(p, maxWidth) as string[];
  });
}

/** Options for {@link generateReceiptPDF}. */
export interface GenerateReceiptPdfOptions {
  /**
   * 1-based receipt line from the reimbursement form. When set, used for the bold
   * "Receipt #N" header below the title instead of OCR `document_number` (store receipt #),
   * so the PDF matches the form row and the centered title.
   */
  submissionReceiptLine?: string;
}

/**
 * Parse `receiptNumber` from multipart form; returns undefined if missing or invalid.
 */
export function parseSubmissionReceiptLineForPdf(raw: string | null): string | undefined {
  if (raw == null) return undefined;
  const t = raw.trim();
  if (!/^\d+$/.test(t)) return undefined;
  const n = Number.parseInt(t, 10);
  if (n < 1 || n > 4) return undefined;
  return String(n);
}

export function generateReceiptPDF(
  receipt: ReceiptData,
  title: string,
  options?: GenerateReceiptPdfOptions,
): Uint8Array {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const bottomReserve = 15;
  let pageHeight = doc.internal.pageSize.getHeight();
  let footerY = pageHeight - bottomReserve;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  /** Keep one tall page instead of splitting across pages (better for receipt continuity). */
  const ensureSpace = (needed: number) => {
    if (y + needed <= footerY) return;
    const newHeight = y + needed + bottomReserve;
    doc.internal.pageSize.height = newHeight;
    pageHeight = newHeight;
    footerY = pageHeight - bottomReserve;
  };

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, y, {align: 'center'});
  y += 8;

  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Document type + number header (prefer form line index over OCR store receipt #)
  const docType = receiptFieldString(receipt.document_type) || 'Receipt';
  const submissionLine = options?.submissionReceiptLine?.trim();
  const docNumStr = submissionLine || receiptFieldString(receipt.document_number);
  const docNum = docNumStr ? ` #${docNumStr}` : '';
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${docType}${docNum}`, margin, y);
  y += 8;

  const transcript = receiptFieldString(receipt.raw_transcript);
  const sparseFinancial =
    !(receipt.line_items && receipt.line_items.length > 0) &&
    !receiptFieldString(receipt.subtotal) &&
    !receiptFieldString(receipt.shipping) &&
    !receiptFieldString(receipt.tip) &&
    !receiptFieldString(receipt.total_before_tax) &&
    !receiptFieldString(receipt.tax) &&
    !receiptFieldString(receipt.total);

  const appendTranscript = (heading: string) => {
    if (!transcript) return;
    ensureSpace(14);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80);
    doc.text(heading, margin, y);
    y += 5;
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(transcript, contentWidth) as string[];
    for (const line of lines) {
      ensureSpace(5);
      doc.text(line, margin, y);
      y += 4;
    }
    y += 4;
    doc.setFontSize(10);
  };

  // When structured totals/lines are missing, show full text first so the PDF is still usable.
  if (transcript && sparseFinancial) {
    appendTranscript('DOCUMENT TEXT (from upload)');
  }

  // Vendor info block
  const vendorName = receiptFieldString(receipt.vendor_name);
  const vendorAddress = receiptFieldString(receipt.vendor_address);
  const vendorPhone = receiptFieldString(receipt.vendor_phone);
  if (vendorName || vendorAddress || vendorPhone) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100);
    doc.text('FROM', margin, y);
    y += 5;
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if (vendorName) {
      doc.setFont('helvetica', 'bold');
      for (const line of wrapPdfTextLines(doc, vendorName, contentWidth)) {
        ensureSpace(6);
        doc.text(line, margin, y);
        y += 5;
      }
      doc.setFont('helvetica', 'normal');
    }
    if (vendorAddress) {
      for (const line of wrapPdfTextLines(doc, vendorAddress, contentWidth)) {
        ensureSpace(6);
        doc.text(line, margin, y);
        y += 5;
      }
    }
    if (vendorPhone) {
      ensureSpace(6);
      doc.text(vendorPhone, margin, y);
      y += 5;
    }
    y += 3;
  }

  // Bill-to and dates side by side
  const billTo = receiptFieldString(receipt.bill_to);
  const dateStr = receiptFieldString(receipt.date);
  const dueDateStr = receiptFieldString(receipt.due_date);
  const hasLeftCol = billTo.length > 0;
  const hasRightCol = dateStr.length > 0 || dueDateStr.length > 0;

  if (hasLeftCol || hasRightCol) {
    const colStartY = y;
    let blockBottom = colStartY;

    if (hasLeftCol) {
      let ly = colStartY;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100);
      doc.text('BILL TO', margin, ly);
      ly += 5;
      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const billMaxWidth = hasRightCol ? contentWidth * 0.5 : contentWidth;
      for (const line of wrapPdfTextLines(doc, billTo, billMaxWidth)) {
        ensureSpace(6);
        doc.text(line, margin, ly);
        ly += 5;
      }
      blockBottom = Math.max(blockBottom, ly);
    }

    if (hasRightCol) {
      let ry = colStartY;
      const rightX = pageWidth - margin;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100);
      doc.text('DETAILS', rightX, ry, {align: 'right'});
      ry += 5;
      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (dateStr) {
        doc.text(`Date: ${dateStr}`, rightX, ry, {align: 'right'});
        ry += 5;
      }
      if (dueDateStr) {
        doc.text(`Due: ${dueDateStr}`, rightX, ry, {align: 'right'});
        ry += 5;
      }
      blockBottom = Math.max(blockBottom, ry);
    }
    y = blockBottom + 5;
  }

  // Line items table
  if (receipt.line_items && receipt.line_items.length > 0) {
    ensureSpace(20);

    const colX = {
      desc: margin,
      qty: margin + contentWidth * 0.5,
      price: margin + contentWidth * 0.7,
      total: pageWidth - margin,
    };

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80);
    doc.text('DESCRIPTION', colX.desc, y);
    doc.text('QTY', colX.qty, y, {align: 'right'});
    doc.text('UNIT PRICE', colX.price, y, {align: 'right'});
    doc.text('TOTAL', colX.total, y, {align: 'right'});
    y += 7;

    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    for (const item of receipt.line_items) {
      ensureSpace(8);
      doc.setDrawColor(230);
      doc.line(margin, y - 4, pageWidth - margin, y - 4);

      const descLines = doc.splitTextToSize(
        String(item.description || ''),
        contentWidth * 0.45,
      ) as string[];
      doc.text(descLines, colX.desc, y);
      if (item.qty) doc.text(String(item.qty), colX.qty, y, {align: 'right'});
      if (item.unit_price) doc.text(String(item.unit_price), colX.price, y, {align: 'right'});
      if (item.total) doc.text(String(item.total), colX.total, y, {align: 'right'});
      y += Math.max(descLines.length * 5, 6) + 2;
    }

    doc.setDrawColor(200);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
    y += 4;
  }

  // Totals (order matches typical receipts: items → shipping → tip → pre-tax → tax → grand total)
  const totalsX = pageWidth - margin;
  const subtotalStr = receiptFieldString(receipt.subtotal);
  const shippingStr = receiptFieldString(receipt.shipping);
  const tipStr = receiptFieldString(receipt.tip);
  const beforeTaxStr = receiptFieldString(receipt.total_before_tax);
  const taxStr = receiptFieldString(receipt.tax);
  const totalStr = receiptFieldString(receipt.total);
  if (subtotalStr || shippingStr || tipStr || beforeTaxStr || taxStr || totalStr) {
    ensureSpace(20);
    doc.setFontSize(10);

    if (subtotalStr) {
      doc.setFont('helvetica', 'normal');
      doc.text(`Subtotal:  ${subtotalStr}`, totalsX, y, {align: 'right'});
      y += 6;
    }
    if (shippingStr) {
      doc.setFont('helvetica', 'normal');
      doc.text(`Shipping & handling:  ${shippingStr}`, totalsX, y, {align: 'right'});
      y += 6;
    }
    if (tipStr) {
      doc.setFont('helvetica', 'normal');
      doc.text(`Tip:  ${tipStr}`, totalsX, y, {align: 'right'});
      y += 6;
    }
    if (beforeTaxStr) {
      doc.setFont('helvetica', 'normal');
      doc.text(`Total before tax:  ${beforeTaxStr}`, totalsX, y, {align: 'right'});
      y += 6;
    }
    if (taxStr) {
      doc.setFont('helvetica', 'normal');
      doc.text(`Tax:  ${taxStr}`, totalsX, y, {align: 'right'});
      y += 6;
    }
    if (totalStr) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Total:  ${totalStr}`, totalsX, y, {align: 'right'});
      y += 8;
    }
  }

  // Notes
  const notesStr = receiptFieldString(receipt.notes);
  if (notesStr) {
    ensureSpace(15);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100);
    doc.text('NOTES', margin, y);
    y += 5;
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(notesStr, contentWidth) as string[];
    for (const line of noteLines) {
      ensureSpace(6);
      doc.text(line, margin, y);
      y += 5;
    }
  }

  // Footer (leave room below last content)
  const minPageForFooter = y + 22;
  if (minPageForFooter > pageHeight) {
    doc.internal.pageSize.height = minPageForFooter;
    pageHeight = minPageForFooter;
  }
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128);
  doc.text('Automatically transcribed from uploaded file.', pageWidth / 2, pageHeight - 10, {
    align: 'center',
  });

  return new Uint8Array(doc.output('arraybuffer'));
}
