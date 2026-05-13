import jsPDF from 'jspdf';

import {MAX_RECEIPT_LINES} from '~/lib/reimbursement/validation';

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

/** User-facing error when Gemini output would produce a misleading treasurer PDF. */
export const RECEIPT_EXTRACTION_QUALITY_ERROR =
  'Automatic transcription does not match this receipt reliably (merged columns or mismatched line totals). For long or multi-page receipts, try the full PDF from the store if you have it; otherwise a clearer photo helps. You can also keep the original without conversion.';

function parseMoneyAmount(raw: string): number | null {
  const t = receiptFieldString(raw).replace(/\$/g, '').replace(/,/g, '').trim();
  if (!t) return null;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

function maxTabsPerLine(text: string): number {
  let max = 0;
  for (const line of text.split(/\r?\n/)) {
    const n = (line.match(/\t/g) ?? []).length;
    if (n > max) max = n;
  }
  return max;
}

function lineItemTotalsSum(items: ReceiptData['line_items']): {sum: number; withTotal: number} {
  let sum = 0;
  let withTotal = 0;
  for (const li of items ?? []) {
    const t = parseMoneyAmount(receiptFieldString(li.total));
    if (t != null) {
      sum += t;
      withTotal++;
    }
  }
  return {sum, withTotal};
}

/**
 * When the model mis-labels "subtotal" (common on multi-page or tall register tapes),
 * line totals may still match total_before_tax or (grand total − tax − shipping − tip).
 */
function lineTotalsReconcileWithAnchors(
  receipt: ReceiptData,
  sum: number,
  sub: number,
  primaryTolerance: number,
): boolean {
  if (Math.abs(sum - sub) <= primaryTolerance) return true;

  const magnitude = Math.max(Math.abs(sum), Math.abs(sub), 1);
  const altTol = Math.max(5, primaryTolerance * 1.5, magnitude * 0.045);

  const tbt = parseMoneyAmount(receiptFieldString(receipt.total_before_tax));
  if (tbt != null && Math.abs(sum - tbt) <= altTol) return true;

  const total = parseMoneyAmount(receiptFieldString(receipt.total));
  if (total != null) {
    const tax = parseMoneyAmount(receiptFieldString(receipt.tax)) ?? 0;
    const ship = parseMoneyAmount(receiptFieldString(receipt.shipping)) ?? 0;
    const tip = parseMoneyAmount(receiptFieldString(receipt.tip)) ?? 0;
    const impliedMerchandise = total - tax - ship - tip;
    if (Number.isFinite(impliedMerchandise) && Math.abs(sum - impliedMerchandise) <= altTol) {
      return true;
    }
  }

  return false;
}

/**
 * Reject extractions where the model merged table columns (tabs), dumped tab-separated
 * blocks into transcript/notes, or line-item totals do not add up to the stated subtotal.
 * Exported for unit tests.
 */
export function assessReceiptExtractionQuality(
  receipt: ReceiptData,
): {ok: true} | {ok: false; message: string} {
  const items = receipt.line_items ?? [];
  for (const li of items) {
    for (const key of ['description', 'qty', 'unit_price', 'total'] as const) {
      const v = receiptFieldString(li[key]);
      if (v.includes('\t')) {
        return {ok: false, message: RECEIPT_EXTRACTION_QUALITY_ERROR};
      }
    }
  }

  for (const block of [
    receiptFieldString(receipt.raw_transcript),
    receiptFieldString(receipt.notes),
  ]) {
    if (block && maxTabsPerLine(block) >= 4) {
      return {ok: false, message: RECEIPT_EXTRACTION_QUALITY_ERROR};
    }
  }

  if (items.length >= 5) {
    const sub = parseMoneyAmount(receiptFieldString(receipt.subtotal));
    if (sub != null) {
      const {sum, withTotal} = lineItemTotalsSum(items);
      const needTotals = Math.ceil(items.length * 0.7);
      if (withTotal >= needTotals) {
        const tolerance = Math.max(2.5, sub * 0.03, items.length * 0.015);
        if (!lineTotalsReconcileWithAnchors(receipt, sum, sub, tolerance)) {
          return {ok: false, message: RECEIPT_EXTRACTION_QUALITY_ERROR};
        }
      }
    }
  }

  return {ok: true};
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
): Promise<{receipts: ReceiptData[]} | {error: string; status: number}> {
  const base64Data = bytesToBase64(fileBytes);
  const isPDF = mimeType === 'application/pdf';

  const structuredPrompt = `Extract data from this ${isPDF ? 'PDF document (read every page, in order)' : 'image'}.

Return a single JSON object. No markdown code fences. Escape quotes inside strings.

First, count how many DISTINCT purchase documents / register receipts are visible (e.g. two separate paper slips in one photo, or two unrelated store receipts in one frame). One Amazon order = one receipt. A receipt plus unrelated marketing text = still one receipt.

Multi-page PDFs and very long register tapes: If ONE purchase / one payment spans multiple pages or a single tall image, return exactly ONE object in "receipts" with "line_items" listing every product/service row from all pages in reading order (do not stop after the first page). "subtotal" must be the full merchandise / item subtotal for that entire purchase (not a running subtotal printed partway down the slip). If the slip shows "total before tax" or similar, align "subtotal" and "line_items" so the sum of line totals matches that merchandise total.

Required:
- "receipts": array of one or more objects — one object per distinct receipt, in reading order (top to bottom, then page order for PDFs). Do not merge two slips into one object.

Each element of "receipts" must include when possible:
- "raw_transcript": string — ALL visible text for THAT slip only, reading order, newlines between lines. Flatten columns/tables into lines. Do not paste text from a different slip into this slip's transcript.

Also fill when possible on each slip (omit keys only if absent):
- "vendor_name", "vendor_address", "vendor_phone"
- "document_type", "document_number", "date", "due_date", "bill_to"
- "line_items": [{"description","qty","unit_price","total"}] — one entry per distinct product/service row on that slip
- "subtotal" — sum of line items only (e-commerce: "Item(s) subtotal" / merchandise subtotal), NOT shipping or tax
- "shipping" — shipping, handling, and/or delivery fees as one amount when shown together (e.g. "Shipping & Handling: $6.54"); include delivery/service fees here if not a separate line item
- "tip" — gratuity or service tip when present
- "total_before_tax" — when the receipt shows it (e.g. Amazon "Total before tax" after shipping)
- "tax" — sales or estimated tax
- "total" — grand total / amount paid for that slip
- "notes" — short non-dollar text (delivery instructions, return policy). Do not repeat shipping, tip, or tax amounts here if they are already in the fields above.

E-commerce (Amazon, Walmart, Target, DoorDash, etc.): map the order summary faithfully — item subtotal → subtotal; shipping & handling → shipping; tips → tip; grand total → total. Structured dollar fields should reconcile to the same final total as that slip.

If there is exactly one receipt, still use "receipts": [ { ... } ] with a single element.`;

  const structured = await geminiMultimodal(apiKey, mimeType, base64Data, structuredPrompt, 16_384);
  if (!structured.ok) {
    return {error: structured.error, status: structured.status};
  }

  let receipts = parseExtractedReceiptsJSON(structured.text);
  if (receipts.length === 0) {
    receipts = [{}];
  }

  const [onlyReceipt] = receipts;
  if (
    receipts.length === 1 &&
    onlyReceipt &&
    needsPlainTranscriptFallback(onlyReceipt, fileBytes)
  ) {
    const plainPrompt = `This is a receipt, invoice, or order confirmation (${isPDF ? 'PDF — read every page in order' : 'image'}).

Output ONLY plain text. Do not use JSON or markdown.

Transcribe every visible word in natural reading order (top to bottom). Include:
- Store or seller name, addresses if shown
- Order / invoice / confirmation numbers
- Every product or service line with quantities and prices
- Shipping, tax, discounts, gift cards, and the final amount paid

Use blank lines between sections. If text is in columns or a table, read row by row so a treasurer can follow it.`;

    const plain = await geminiMultimodal(apiKey, mimeType, base64Data, plainPrompt, 16_384);
    if (plain.ok) {
      const cleaned = stripMarkdownCodeFence(plain.text);
      const prevLen = receiptFieldString(onlyReceipt.raw_transcript).length;
      if (cleaned.length > prevLen) {
        receipts = [{...onlyReceipt, raw_transcript: cleaned}];
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

  for (const r of receipts) {
    const q = assessReceiptExtractionQuality(r);
    if (!q.ok) {
      return {error: q.message, status: 422};
    }
  }

  return {receipts};
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

function coerceReceiptData(raw: unknown): ReceiptData {
  if (!raw || typeof raw !== 'object') return {};
  const o = raw as Record<string, unknown>;
  const out: ReceiptData = {};
  const scalarKeys: (keyof ReceiptData)[] = [
    'vendor_name',
    'vendor_address',
    'vendor_phone',
    'document_type',
    'document_number',
    'date',
    'due_date',
    'bill_to',
    'subtotal',
    'shipping',
    'tip',
    'total_before_tax',
    'tax',
    'total',
    'notes',
    'raw_transcript',
  ];
  for (const key of scalarKeys) {
    const v = o[key as string];
    if (v === undefined || v === null) continue;
    (out as Record<string, unknown>)[key as string] =
      typeof v === 'string' || typeof v === 'number' ? v : String(v);
  }
  if (Array.isArray(o.line_items)) {
    out.line_items = o.line_items
      .filter((li): li is Record<string, unknown> => li != null && typeof li === 'object')
      .map((li) => ({
        description: li.description != null ? String(li.description) : undefined,
        qty: li.qty != null ? String(li.qty) : undefined,
        unit_price: li.unit_price != null ? String(li.unit_price) : undefined,
        total: li.total != null ? String(li.total) : undefined,
      }));
  }
  return out;
}

function parseExtractedReceiptsJSON(rawText: string): ReceiptData[] {
  try {
    let cleaned = rawText
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/, '')
      .trim();
    if (!cleaned.startsWith('{')) {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) cleaned = match[0];
    }
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    if (Array.isArray(parsed.receipts) && parsed.receipts.length > 0) {
      return parsed.receipts.map((r) => coerceReceiptData(r));
    }
    if (Array.isArray(parsed.receipts) && parsed.receipts.length === 0) {
      const sole = coerceReceiptData(parsed);
      return Object.keys(sole).length > 0 ? [sole] : [{}];
    }
    return [coerceReceiptData(parsed)];
  } catch {
    return [parseLegacySingleReceiptJSON(rawText)];
  }
}

function parseLegacySingleReceiptJSON(rawText: string): ReceiptData {
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
  if (n < 1 || n > MAX_RECEIPT_LINES) return undefined;
  return String(n);
}

function renderReceiptSlipOnPage(
  doc: jsPDF,
  receipt: ReceiptData,
  title: string,
  options: GenerateReceiptPdfOptions | undefined,
  slipIndex: number,
  slipTotal: number,
): void {
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

  if (slipTotal > 1) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60);
    doc.text(`Slip ${slipIndex + 1} of ${slipTotal}`, pageWidth / 2, y, {align: 'center'});
    y += 7;
    doc.setTextColor(0);
  }

  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Document type + number header (prefer form line index over OCR store receipt #)
  const docType = receiptFieldString(receipt.document_type) || 'Receipt';
  const submissionLine = slipIndex === 0 ? options?.submissionReceiptLine?.trim() : undefined;
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
}

export function generateReceiptPDF(
  receiptOrReceipts: ReceiptData | ReceiptData[],
  title: string,
  options?: GenerateReceiptPdfOptions,
): Uint8Array {
  const receipts = Array.isArray(receiptOrReceipts) ? receiptOrReceipts : [receiptOrReceipts];
  const list = receipts.length > 0 ? receipts : [{}];
  const doc = new jsPDF();
  for (let slipIndex = 0; slipIndex < list.length; slipIndex++) {
    if (slipIndex > 0) {
      doc.addPage();
    }
    const slip = list[slipIndex];
    if (slip !== undefined) {
      renderReceiptSlipOnPage(doc, slip, title, options, slipIndex, list.length);
    }
  }
  return new Uint8Array(doc.output('arraybuffer'));
}
