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
  subtotal?: string;
  tax?: string;
  total?: string;
  notes?: string;
}

/**
 * Calls Gemini to extract structured receipt data from an image or PDF.
 * Retries on 503/429 with exponential backoff.
 * Returns null if extraction fails (caller should handle the error response).
 */
export async function extractReceiptData(
  file: File,
  apiKey: string,
): Promise<{receipt: ReceiptData} | {error: string; status: number}> {
  const fileBytes = new Uint8Array(await file.arrayBuffer());

  let binary = '';
  for (let i = 0; i < fileBytes.length; i++) {
    binary += String.fromCharCode(fileBytes[i]);
  }
  const base64Data = btoa(binary);

  const isPDF = file.type === 'application/pdf';
  const prompt = `Extract the receipt/invoice data from this ${isPDF ? 'PDF' : 'image'} and return it as JSON with this structure:
{
  "vendor_name": "business name",
  "vendor_address": "full address on one line",
  "vendor_phone": "phone number",
  "document_type": "Invoice" or "Receipt" or "Quote" etc,
  "document_number": "invoice/receipt number if present",
  "date": "date of the document",
  "due_date": "due date if present",
  "bill_to": "who it's billed/payable to",
  "line_items": [{"description": "item name", "qty": "quantity", "unit_price": "$X.XX", "total": "$X.XX"}],
  "subtotal": "$X.XX",
  "tax": "$X.XX if present",
  "total": "$X.XX",
  "notes": "any additional notes"
}
Omit fields that aren't present. Return ONLY valid JSON, no markdown fencing or extra text.`;

  const geminiBody = JSON.stringify({
    contents: [
      {
        parts: [
          {inline_data: {mime_type: file.type, data: base64Data}},
          {text: prompt},
        ],
      },
    ],
    generationConfig: {maxOutputTokens: 2048},
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

    if (geminiResponse!.ok) break;
    console.warn(`Gemini ${model} unavailable, trying next model...`);
  }

  if (!geminiResponse!.ok) {
    const errBody = await geminiResponse!.text();
    console.error('Gemini API error:', geminiResponse!.status, errBody);
    return {error: 'Failed to process file with AI.', status: 502};
  }

  const geminiResult = (await geminiResponse!.json()) as {
    candidates?: Array<{content?: {parts?: Array<{text?: string}>}}>;
  };

  const rawText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!rawText) {
    return {error: 'Could not extract data from file.', status: 422};
  }

  return {receipt: parseReceiptJSON(rawText)};
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
      ['tax', /"tax"\s*:\s*"([^"]*)"/],
      ['total', /"total"\s*:\s*"([^"]*)"/],
      ['notes', /"notes"\s*:\s*"([^"]*)"/],
    ];
    for (const [field, pattern] of fieldPatterns) {
      const match = rawText.match(pattern);
      if (match) {
        (extracted as Record<string, string>)[field] = match[1];
      }
    }

    const itemsMatch = rawText.match(/"line_items"\s*:\s*\[([\s\S]*?)(?:\]|$)/);
    if (itemsMatch) {
      const items: ReceiptData['line_items'] = [];
      const itemPattern = /\{[^}]*"description"\s*:\s*"([^"]*)"[^}]*\}/g;
      let itemMatch;
      while ((itemMatch = itemPattern.exec(itemsMatch[1])) !== null) {
        const itemStr = itemMatch[0];
        items.push({
          description: itemMatch[1],
          qty: itemStr.match(/"qty"\s*:\s*"([^"]*)"/)?.[1],
          unit_price: itemStr.match(/"unit_price"\s*:\s*"([^"]*)"/)?.[1],
          total: itemStr.match(/"total"\s*:\s*"([^"]*)"/)?.[1],
        });
      }
      if (items.length > 0) extracted.line_items = items;
    }

    return Object.keys(extracted).length > 0
      ? extracted
      : {notes: rawText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim()};
  }
}

export function generateReceiptPDF(receipt: ReceiptData, title: string): Uint8Array {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const footerY = pageHeight - 15;
  let y = 20;

  const ensureSpace = (needed: number) => {
    if (y + needed > footerY) {
      doc.addPage();
      y = 20;
    }
  };

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, y, {align: 'center'});
  y += 8;

  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Document type + number header
  const docType = receipt.document_type || 'Receipt';
  const docNum = receipt.document_number ? ` #${receipt.document_number}` : '';
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${docType}${docNum}`, margin, y);
  y += 8;

  // Vendor info block
  if (receipt.vendor_name || receipt.vendor_address || receipt.vendor_phone) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100);
    doc.text('FROM', margin, y);
    y += 5;
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if (receipt.vendor_name) {
      doc.setFont('helvetica', 'bold');
      doc.text(receipt.vendor_name, margin, y);
      doc.setFont('helvetica', 'normal');
      y += 5;
    }
    if (receipt.vendor_address) {
      doc.text(receipt.vendor_address, margin, y);
      y += 5;
    }
    if (receipt.vendor_phone) {
      doc.text(receipt.vendor_phone, margin, y);
      y += 5;
    }
    y += 3;
  }

  // Bill-to and dates side by side
  const hasLeftCol = !!receipt.bill_to;
  const hasRightCol = !!(receipt.date || receipt.due_date);

  if (hasLeftCol || hasRightCol) {
    const colStartY = y;

    if (hasLeftCol) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100);
      doc.text('BILL TO', margin, y);
      y += 5;
      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(receipt.bill_to!, margin, y);
      y += 5;
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
      if (receipt.date) {
        doc.text(`Date: ${receipt.date}`, rightX, ry, {align: 'right'});
        ry += 5;
      }
      if (receipt.due_date) {
        doc.text(`Due: ${receipt.due_date}`, rightX, ry, {align: 'right'});
        ry += 5;
      }
      y = Math.max(y, ry);
    }
    y += 5;
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

  // Totals
  const totalsX = pageWidth - margin;
  if (receipt.subtotal || receipt.tax || receipt.total) {
    ensureSpace(20);
    doc.setFontSize(10);

    if (receipt.subtotal) {
      doc.setFont('helvetica', 'normal');
      doc.text(`Subtotal:  ${receipt.subtotal}`, totalsX, y, {align: 'right'});
      y += 6;
    }
    if (receipt.tax) {
      doc.setFont('helvetica', 'normal');
      doc.text(`Tax:  ${receipt.tax}`, totalsX, y, {align: 'right'});
      y += 6;
    }
    if (receipt.total) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Total:  ${receipt.total}`, totalsX, y, {align: 'right'});
      y += 8;
    }
  }

  // Notes
  if (receipt.notes) {
    ensureSpace(15);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100);
    doc.text('NOTES', margin, y);
    y += 5;
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(receipt.notes, contentWidth) as string[];
    for (const line of noteLines) {
      ensureSpace(6);
      doc.text(line, margin, y);
      y += 5;
    }
  }

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128);
  doc.text('Automatically transcribed from uploaded image.', pageWidth / 2, pageHeight - 10, {
    align: 'center',
  });

  return new Uint8Array(doc.output('arraybuffer'));
}
