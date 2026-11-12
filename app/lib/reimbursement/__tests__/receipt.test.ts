import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {MAX_RECEIPT_LINES} from '~/lib/reimbursement/validation';

import {
  ACCEPTED_TYPES,
  assessReceiptExtractionQuality,
  countPdfPages,
  enrichReceiptMoneyFields,
  extractReceiptData,
  generateReceiptPDF,
  keepCircledLineItems,
  MAX_FILE_SIZE,
  mergeReceiptMoneyFields,
  normalizeReceiptTotals,
  parseSubmissionReceiptLineForPdf,
  receiptFieldString,
  receiptHasUsableMoney,
  salvageLongDocumentReceipt,
} from '../receipt';

describe('normalizeReceiptTotals', () => {
  it('promotes subtotal when total is balance-due zero', () => {
    const out = normalizeReceiptTotals({
      line_items: [{description: 'Add Hired & Non-owned Auto (HNOA)', total: '5'}],
      subtotal: '5',
      total: '0',
      vendor_name: 'ASSOCIATION INSURANCE MANAGEMENT INC',
    });
    expect(out.total).toBe('5');
    expect(out.subtotal).toBe('5');
  });

  it('adds tax/shipping/tip onto subtotal when repairing a zero total', () => {
    const out = normalizeReceiptTotals({
      shipping: '2',
      subtotal: '10',
      tax: '0.80',
      tip: '1',
      total: '0.00',
    });
    expect(out.total).toBe('13.80');
  });

  it('fills a missing total from subtotal + tip (thermal catering slips)', () => {
    const out = normalizeReceiptTotals({
      subtotal: '445.50',
      tip: '89.10',
    });
    expect(out.total).toBe('534.60');
  });

  it('leaves a real zero total alone when nothing positive is available', () => {
    const out = normalizeReceiptTotals({subtotal: '0', total: '0'});
    expect(out.total).toBe('0');
  });

  it('does not change a positive total', () => {
    const out = normalizeReceiptTotals({subtotal: '5', total: '5.00'});
    expect(out.total).toBe('5.00');
  });
});

describe('enrichReceiptMoneyFields', () => {
  it('fills line totals from qty × unit_price and rolls up subtotal/total', () => {
    const out = enrichReceiptMoneyFields({
      line_items: [
        {description: 'Box Lunch', qty: '46', unit_price: '3.25'},
        {description: 'California Club', qty: '13', unit_price: '7'},
      ],
      tip: '89.10',
    });
    expect(out.line_items?.[0]?.total).toBe('149.50');
    expect(out.line_items?.[1]?.total).toBe('91');
    expect(out.subtotal).toBe('240.50');
    expect(out.total).toBe('329.60');
  });
});

describe('keepCircledLineItems', () => {
  it('keeps circled lines and replaces the order grand total with their sum', () => {
    const out = keepCircledLineItems({
      line_items: [
        {claimed: false, description: 'Dog treat', total: '9.98'},
        {claimed: true, description: 'Ping pong balls', total: '6.89'},
        {claimed: false, description: 'Ribs', total: '17.97'},
      ],
      subtotal: '34.84',
      tax: '2.29',
      total: '37.13',
      vendor_name: 'Amazon.com',
    });
    expect(out.line_items?.map((li) => li.description)).toEqual(['Ping pong balls']);
    expect(out.subtotal).toBe('6.89');
    expect(out.total).toBe('6.89');
    expect(out.tax).toBeUndefined();
    expect(out.notes).toMatch(/circled/i);
  });

  it('leaves a slip unchanged when no line is marked claimed', () => {
    const receipt = {
      line_items: [
        {description: 'A', total: '5'},
        {description: 'B', total: '4'},
      ],
      total: '9',
    };
    expect(keepCircledLineItems(receipt)).toEqual(receipt);
  });

  it('keeps the printed total when every line is circled and it already matches', () => {
    const receipt = {
      line_items: [
        {claimed: true, description: 'Bulletin board', total: '9.99'},
        {claimed: true, description: 'Fidgets', total: '9.99'},
      ],
      tax: '1.60',
      total: '19.98',
    };
    const out = keepCircledLineItems(receipt);
    expect(out.line_items).toHaveLength(2);
    expect(out.total).toBe('19.98');
    expect(out.tax).toBe('1.60');
  });

  it('drops a larger order total when the returned lines are all marked claimed', () => {
    const out = keepCircledLineItems({
      line_items: [
        {claimed: true, description: 'Bulletin board', total: '9.99'},
        {claimed: 'yes' as unknown as boolean, description: 'Fidgets', total: '9.99'},
      ],
      tax: '4.00',
      total: '72.04',
    });
    expect(out.total).toBe('19.98');
    expect(out.tax).toBeUndefined();
    expect(out.line_items).toHaveLength(2);
  });
});

describe('mergeReceiptMoneyFields', () => {
  it('overlays priced lines and grand total onto an unpriced primary extract', () => {
    const out = mergeReceiptMoneyFields(
      {
        line_items: [{description: 'Paper Mate Flair'}, {description: 'Nature Made B12'}],
        vendor_name: 'Amazon.com',
      },
      {
        line_items: [
          {description: 'Paper Mate Flair', total: '9.79'},
          {description: 'Nature Made B12', total: '9.36'},
        ],
        subtotal: '73.09',
        tax: '2.21',
        total: '72.04',
      },
    );
    expect(out.line_items?.[0]?.total).toBe('9.79');
    expect(out.total).toBe('72.04');
    expect(receiptHasUsableMoney(out)).toBe(true);
  });
});

describe('assessReceiptExtractionQuality', () => {
  it('rejects tab-merged line item fields (multi-column collapse)', () => {
    const r = assessReceiptExtractionQuality({
      line_items: [
        {description: 'A', qty: '1', total: '1'},
        {description: 'B\tC\tD', qty: '1', total: '2'},
      ],
      subtotal: '3',
    });
    expect(r.ok).toBe(false);
  });

  it('rejects raw_transcript lines with many tab separators', () => {
    const r = assessReceiptExtractionQuality({
      line_items: [{description: 'Only', qty: '1', total: '1'}],
      raw_transcript: 'ok line\na\tb\tc\td\te',
    });
    expect(r.ok).toBe(false);
  });

  it('rejects when line totals do not reconcile with subtotal on long slips', () => {
    const items = Array.from({length: 6}, (_, i) => ({
      description: `Item ${i}`,
      qty: '1',
      total: '10',
    }));
    const r = assessReceiptExtractionQuality({
      line_items: items,
      subtotal: '100',
    });
    expect(r.ok).toBe(false);
  });

  it('accepts dense slips when totals match subtotal', () => {
    const r = assessReceiptExtractionQuality({
      line_items: [
        {description: 'A', qty: '1', total: '10'},
        {description: 'B', qty: '1', total: '10'},
        {description: 'C', qty: '1', total: '10'},
        {description: 'D', qty: '1', total: '10'},
        {description: 'E', qty: '1', total: '10'},
      ],
      subtotal: '50',
    });
    expect(r.ok).toBe(true);
  });

  it('accepts when subtotal is mislabeled but total_before_tax matches line sum', () => {
    const r = assessReceiptExtractionQuality({
      line_items: [
        {description: 'A', qty: '1', total: '10'},
        {description: 'B', qty: '1', total: '10'},
        {description: 'C', qty: '1', total: '10'},
        {description: 'D', qty: '1', total: '10'},
        {description: 'E', qty: '1', total: '10'},
      ],
      subtotal: '40',
      total_before_tax: '50',
    });
    expect(r.ok).toBe(true);
  });

  it('accepts when subtotal is wrong but grand total minus tax/shipping/tip matches line sum', () => {
    const r = assessReceiptExtractionQuality({
      line_items: [
        {description: 'A', qty: '1', total: '10'},
        {description: 'B', qty: '1', total: '10'},
        {description: 'C', qty: '1', total: '10'},
        {description: 'D', qty: '1', total: '10'},
        {description: 'E', qty: '1', total: '10'},
      ],
      shipping: '0',
      subtotal: '999',
      tax: '8',
      total: '58',
      tip: '0',
    });
    expect(r.ok).toBe(true);
  });

  it('skips sum check when fewer than five line items', () => {
    const r = assessReceiptExtractionQuality({
      line_items: [
        {description: 'A', qty: '1', total: '1'},
        {description: 'B', qty: '1', total: '99'},
      ],
      subtotal: '5',
    });
    expect(r.ok).toBe(true);
  });

  it('keeps grand totals on long scans when line columns do not reconcile', () => {
    const items = Array.from({length: 8}, (_, i) => ({
      description: `Item ${i}`,
      qty: '1',
      total: '10',
    }));
    const salvaged = salvageLongDocumentReceipt({
      line_items: items,
      raw_transcript: 'Teachers Pay Teachers\nTotal $131.89',
      subtotal: '121.74',
      tax: '10.15',
      total: '131.89',
      vendor_name: 'Teachers Pay Teachers',
    });
    expect(salvaged?.total).toBe('131.89');
    expect(salvaged?.subtotal).toBe('121.74');
    expect(salvaged?.line_items ?? []).toHaveLength(0);
    expect(salvaged && assessReceiptExtractionQuality(salvaged).ok).toBe(true);
  });

  it('strips tab-dumped transcripts on long scans and keeps priced lines that already add up', () => {
    const salvaged = salvageLongDocumentReceipt({
      line_items: [
        {description: 'Pens', qty: '1', total: '9.79'},
        {description: 'Vitamins', qty: '1', total: '9.36'},
      ],
      raw_transcript: 'Pens\t9.79\tVitamins\t9.36\tTotal',
      subtotal: '19.15',
      total: '19.15',
      vendor_name: 'Amazon.com',
    });
    expect(salvaged?.line_items).toHaveLength(2);
    expect(salvaged?.raw_transcript).not.toContain('\t');
    expect(salvaged?.total).toBe('19.15');
  });

  it('drops a long-scan slip that has no usable dollars', () => {
    const salvaged = salvageLongDocumentReceipt({
      line_items: [{description: 'A\tB\tC\tD'}, {description: 'E\tF\tG\tH'}],
      vendor_name: 'Unknown',
    });
    expect(salvaged).toBeNull();
  });

  it('rejects unpriced multi-item extracts with no totals (ThunderCloud / Amazon failure mode)', () => {
    const r = assessReceiptExtractionQuality({
      line_items: [
        {description: 'Box Lunch'},
        {description: 'California Club'},
        {description: 'American Classic'},
        {description: 'Chicken Salad'},
      ],
      vendor_name: 'ThunderCloud',
    });
    expect(r.ok).toBe(false);
  });
});

describe('receiptFieldString', () => {
  it('normalizes primitives', () => {
    expect(receiptFieldString(null)).toBe('');
    expect(receiptFieldString(undefined)).toBe('');
    expect(receiptFieldString('  x  ')).toBe('x');
    expect(receiptFieldString(12.5)).toBe('12.5');
    expect(receiptFieldString(Number.NaN)).toBe('NaN');
    expect(receiptFieldString(true)).toBe('yes');
    expect(receiptFieldString(false)).toBe('');
    expect(receiptFieldString({})).toBe('[object Object]');
  });
});

describe('parseSubmissionReceiptLineForPdf', () => {
  it('parses valid line numbers or rejects', () => {
    expect(parseSubmissionReceiptLineForPdf(null)).toBeUndefined();
    expect(parseSubmissionReceiptLineForPdf('')).toBeUndefined();
    expect(parseSubmissionReceiptLineForPdf(' 2 ')).toBe('2');
    expect(parseSubmissionReceiptLineForPdf('0')).toBeUndefined();
    expect(parseSubmissionReceiptLineForPdf('9')).toBe('9');
    expect(parseSubmissionReceiptLineForPdf(String(MAX_RECEIPT_LINES))).toBe(
      String(MAX_RECEIPT_LINES),
    );
    expect(parseSubmissionReceiptLineForPdf(String(MAX_RECEIPT_LINES + 1))).toBeUndefined();
  });
});

describe('generateReceiptPDF', () => {
  it('prints the transcript when totals exist but line items were dropped', () => {
    const pdf = generateReceiptPDF(
      {
        raw_transcript: 'UNIQUE_TRANSCRIPT_MARKER Grand Total 72.04',
        total: '72.04',
        vendor_name: 'Amazon.com',
      },
      'Title',
    );
    expect(new TextDecoder().decode(pdf)).toContain('UNIQUE_TRANSCRIPT_MARKER');
  });

  it('renders sparse transcript-first layout', () => {
    const pdf = generateReceiptPDF(
      {
        raw_transcript: 'Store line\nTotal $5',
        vendor_address: 'Addr\nLine2',
        vendor_name: 'Multi\nLine Vendor',
        vendor_phone: '555',
      },
      'Title',
    );
    expect(pdf.byteLength).toBeGreaterThan(200);
  });

  it('renders each slip on its own page when given multiple receipts', () => {
    const oneSlip = generateReceiptPDF({raw_transcript: 'A', total: '1'}, 'Title');
    const twoSlips = generateReceiptPDF(
      [
        {raw_transcript: 'A', total: '1'},
        {raw_transcript: 'B', total: '2'},
      ],
      'Title',
    );
    expect(twoSlips.byteLength).toBeGreaterThan(oneSlip.byteLength);
  });

  it('uses submission receipt line in header', () => {
    const pdf = generateReceiptPDF(
      {document_number: '99', document_type: 'Invoice', raw_transcript: 'x'.repeat(50)},
      'T',
      {submissionReceiptLine: '2'},
    );
    expect(pdf.byteLength).toBeGreaterThan(100);
  });

  it('draws structured totals and notes', () => {
    const pdf = generateReceiptPDF(
      {
        line_items: [{description: 'Item', qty: '1', total: '$1', unit_price: '$1'}],
        notes: 'Leave at door',
        shipping: '$2',
        subtotal: '$1',
        tax: '$0.10',
        tip: '$0',
        total: '$3',
        total_before_tax: '$2',
      },
      'Order',
    );
    expect(pdf.byteLength).toBeGreaterThan(200);
  });

  it('handles bill-to and date columns', () => {
    const pdf = generateReceiptPDF(
      {
        bill_to: 'Buyer\nLine',
        date: '2026-01-01',
        due_date: '2026-01-15',
        raw_transcript: 'a'.repeat(1200),
        subtotal: '$1',
        total: '$1',
        line_items: [{description: 'X', total: '$1'}],
      },
      'Doc',
    );
    expect(pdf.byteLength).toBeGreaterThan(200);
  });

  it('keeps wrapped line items on their own rows when the page grows', () => {
    const pdf = generateReceiptPDF(
      {
        line_items: Array.from({length: 20}, (_, i) => ({
          description:
            i === 0
              ? 'ITEM00 Long Amazon book title: A Whimsical Mystery Adventure About Sharing Friendship and Saving Coral Reefs SECOND00'
              : `ITEM${String(i).padStart(2, '0')} Long Amazon book title: A Whimsical Mystery Adventure About Sharing Friendship and Saving Coral Reefs for Children Ages 8-12`,
          qty: '2',
          total: '15.98',
          unit_price: '7.99',
        })),
        total: '319.60',
        vendor_name: 'Amazon.com',
      },
      'Caleb Brown: Receipt 1',
    );
    const asText = new TextDecoder('latin1').decode(pdf);
    const baseline = (label: string) => {
      const idx = asText.indexOf(label);
      expect(idx).toBeGreaterThan(-1);
      const tds = [...asText.slice(0, idx).matchAll(/([\d.]+) ([\d.]+) Td/g)];
      const lastTd = tds.at(-1);
      if (!lastTd) throw new Error(`no text position before ${label}`);
      return Number(lastTd[2]);
    };
    const first = baseline('ITEM00');
    const wrapped = baseline('SECOND00');
    const second = baseline('ITEM01');
    const previous = baseline('ITEM18');
    const last = baseline('ITEM19');
    const box = asText.match(/\/MediaBox\s*\[\s*0\s+0\s+[\d.]+\s+([\d.]+)\s*\]/);
    expect(box).toBeTruthy();
    const pageHeight = Number(box?.[1]);
    // One copy of each row. Wrapped lines sit just under the title, later rows stay
    // below them, and the first row stays near the top of the page.
    expect(asText.match(/ITEM19/g)?.length).toBe(1);
    expect(first - wrapped).toBeGreaterThan(8);
    expect(first - wrapped).toBeLessThan(40);
    expect(wrapped).toBeGreaterThan(second);
    expect(previous - last).toBeGreaterThan(8);
    expect(previous - last).toBeLessThan(90);
    expect(last).toBeGreaterThan(20);
    expect(pageHeight - first).toBeLessThan(250);
  });

  it('extends page height for long notes and dense transcript blocks', () => {
    const pdf = generateReceiptPDF(
      {
        line_items: Array.from({length: 25}, () => ({
          description: 'D'.repeat(120),
          qty: '1',
          total: '$1',
          unit_price: '$1',
        })),
        notes: 'N\n'.repeat(80),
        raw_transcript: 'R'.repeat(8000),
        subtotal: '$1',
        total: '$1',
      },
      'Big',
    );
    expect(pdf.byteLength).toBeGreaterThan(4000);
  });
});

describe('countPdfPages', () => {
  it('counts page objects and ignores the pages tree', () => {
    const body = `%PDF-1.4
1 0 obj << /Type /Pages /Count 3 /Kids [2 0 R 3 0 R 4 0 R] >> endobj
2 0 obj << /Type /Page >> endobj
3 0 obj << /Type /Page >> endobj
4 0 obj << /Type /Page >> endobj
`;
    expect(countPdfPages(new TextEncoder().encode(body))).toBe(3);
    expect(countPdfPages(new Uint8Array([1, 2, 3, 4]))).toBeNull();
  });
});

describe('extractReceiptData', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  function geminiResponse(text: string, thought?: boolean) {
    const parts = thought ? [{thought: true, text: 'hidden'}, {text}] : [{text}];
    return {
      json: async () => ({candidates: [{content: {parts}}]}),
      ok: true,
      status: 200,
    };
  }

  it('salvages a multi-page PDF when line totals do not match', async () => {
    const body = JSON.stringify({
      receipts: [
        {
          line_items: Array.from({length: 6}, (_, i) => ({
            description: `Row ${i}`,
            qty: '1',
            total: '10',
          })),
          raw_transcript: 'Order summary Grand Total $72.04',
          subtotal: '72.04',
          total: '72.04',
          vendor_name: 'Amazon.com',
        },
      ],
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ...geminiResponse(body),
      text: async () => '',
    });
    vi.stubGlobal('fetch', fetchMock);
    const pdf = new TextEncoder().encode(
      '%PDF-1.4\n1 0 obj << /Type /Pages /Count 2 >> endobj\n2 0 obj << /Type /Page >> endobj\n3 0 obj << /Type /Page >> endobj\n',
    );
    const out = await extractReceiptData(pdf, 'application/pdf', 'api-key');
    if (!('receipts' in out)) {
      expect.fail('expected salvaged receipts');
    }
    expect(out.receipts[0]?.total).toBe('72.04');
    expect(out.receipts[0]?.line_items ?? []).toHaveLength(0);
    const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as {
      generationConfig: {maxOutputTokens: number};
    };
    expect(request.generationConfig.maxOutputTokens).toBeGreaterThan(16_384);
  });

  it('returns 422 when extraction quality checks fail', async () => {
    const body = JSON.stringify({
      receipts: [
        {
          line_items: [{description: 'merged\tcolumns', qty: '1', total: '1'}],
          subtotal: '1',
          total: '1',
          vendor_name: 'V',
        },
      ],
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ...geminiResponse(body),
        text: async () => '',
      }),
    );
    const out = await extractReceiptData(new Uint8Array(100), 'image/jpeg', 'api-key');
    expect('error' in out && out.status).toBe(422);
  });

  it('returns structured receipt from Gemini', async () => {
    const body = JSON.stringify({
      raw_transcript: 'hello',
      total: '5',
      vendor_name: 'V',
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ...geminiResponse(body),
        text: async () => '',
      }),
    );
    const small = new Uint8Array(100);
    const out = await extractReceiptData(small, 'image/jpeg', 'api-key');
    expect('receipts' in out && out.receipts[0]?.vendor_name).toBe('V');
  });

  it('returns multiple receipts when Gemini returns a receipts array', async () => {
    const body = JSON.stringify({
      receipts: [
        {raw_transcript: 'store A', total: '5', vendor_name: 'Shop A'},
        {raw_transcript: 'store B', total: '10', vendor_name: 'Shop B'},
      ],
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ...geminiResponse(body),
        text: async () => '',
      }),
    );
    const small = new Uint8Array(100);
    const out = await extractReceiptData(small, 'image/jpeg', 'api-key');
    if (!('receipts' in out)) {
      expect.fail('expected success with receipts');
    }
    expect(out.receipts.length).toBe(2);
    expect(out.receipts[0]?.vendor_name).toBe('Shop A');
    expect(out.receipts[1]?.vendor_name).toBe('Shop B');
  });

  it('runs a money repair pass when the primary extract omits line and grand totals', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const unpriced = JSON.stringify({
      receipts: [
        {
          line_items: [
            {description: 'Box Lunch'},
            {description: 'California Club'},
            {description: 'American Classic'},
            {description: 'Chicken Salad'},
          ],
          vendor_name: 'ThunderCloud',
        },
      ],
    });
    const priced = JSON.stringify({
      receipts: [
        {
          line_items: [
            {description: 'Box Lunch', qty: '46', total: '149.50'},
            {description: 'California Club', qty: '13', total: '91.00'},
            {description: 'American Classic', qty: '2', total: '10.00'},
            {description: 'Chicken Salad', qty: '5', total: '28.75'},
          ],
          subtotal: '445.50',
          tip: '89.10',
          total: '534.60',
          vendor_name: 'ThunderCloud',
        },
      ],
    });
    fetchMock
      .mockResolvedValueOnce({...geminiResponse(unpriced), text: async () => ''})
      .mockResolvedValueOnce({...geminiResponse(priced), text: async () => ''});

    const out = await extractReceiptData(new Uint8Array(100), 'image/jpeg', 'api-key');
    if (!('receipts' in out)) {
      expect.fail('expected money repair to succeed');
    }
    expect(out.receipts[0]?.total).toBe('534.60');
    expect(out.receipts[0]?.line_items?.[0]?.total).toBe('149.50');
    expect(out.receipts[0]?.tip).toBe('89.10');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('runs plain transcript fallback for large files with thin JSON', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const structured = JSON.stringify({
      raw_transcript: 'short',
      total: '1',
    });
    const plain = `${'```\nLong plain text '.repeat(200)}\n\`\`\``;
    fetchMock
      .mockResolvedValueOnce({...geminiResponse(structured), text: async () => ''})
      .mockResolvedValueOnce({...geminiResponse(plain), text: async () => ''});

    const big = new Uint8Array(7000);
    const out = await extractReceiptData(big, 'application/pdf', 'api-key');
    expect('receipts' in out && (out.receipts[0]?.raw_transcript?.length ?? 0)).toBeGreaterThan(
      100,
    );
  });

  it('does not replace transcript when plain response is shorter', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const structured = JSON.stringify({
      raw_transcript: 'already-long-text '.repeat(80),
      total: '1',
    });
    fetchMock
      .mockResolvedValueOnce({...geminiResponse(structured), text: async () => ''})
      .mockResolvedValueOnce({...geminiResponse('tiny'), text: async () => ''});

    const big = new Uint8Array(7000);
    const out = await extractReceiptData(big, 'image/png', 'api-key');
    expect('receipts' in out).toBe(true);
  });

  it('retries on 503 then succeeds', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const okBody = JSON.stringify({raw_transcript: 'ok', total: '1'});
    fetchMock
      .mockResolvedValueOnce({ok: false, status: 503, text: async () => ''})
      .mockResolvedValueOnce({...geminiResponse(okBody), text: async () => ''});

    const p = extractReceiptData(new Uint8Array(50), 'image/jpeg', 'api-key');
    await vi.advanceTimersByTimeAsync(1500);
    const out = await p;
    expect('receipts' in out).toBe(true);
  });

  it('returns 502 when Gemini keeps failing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ok: false, status: 500, text: async () => 'err'}),
    );
    const out = await extractReceiptData(new Uint8Array(10), 'image/jpeg', 'k');
    expect('error' in out && out.status).toBe(502);
  });

  it('returns 422 when no text is extracted', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({candidates: [{content: {parts: []}}]}),
        ok: true,
        status: 200,
        text: async () => '',
      }),
    );
    const out = await extractReceiptData(new Uint8Array(10), 'image/jpeg', 'k');
    expect('error' in out && out.status).toBe(422);
  });

  it('parses fenced JSON and tolerates truncated JSON via regex fallback', async () => {
    const raw = '{ "vendor_name": "Partial", "total": "12.00", "raw_transcript": "broken';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ...geminiResponse(raw),
        text: async () => '',
      }),
    );
    const out = await extractReceiptData(new Uint8Array(20), 'image/jpeg', 'k');
    expect('receipts' in out && out.receipts[0]?.vendor_name).toBe('Partial');
    expect('receipts' in out && out.receipts[0]?.total).toBe('12.00');
  });
});

describe('receipt constants', () => {
  it('exports accepted types and max size', () => {
    expect(ACCEPTED_TYPES).toContain('image/png');
    expect(MAX_FILE_SIZE).toBeGreaterThan(0);
  });
});
