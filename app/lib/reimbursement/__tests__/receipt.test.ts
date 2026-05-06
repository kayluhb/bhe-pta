import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {
  ACCEPTED_TYPES,
  extractReceiptData,
  generateReceiptPDF,
  MAX_FILE_SIZE,
  parseSubmissionReceiptLineForPdf,
  receiptFieldString,
} from '../receipt';

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
  it('parses valid 1-4 or rejects', () => {
    expect(parseSubmissionReceiptLineForPdf(null)).toBeUndefined();
    expect(parseSubmissionReceiptLineForPdf('')).toBeUndefined();
    expect(parseSubmissionReceiptLineForPdf(' 2 ')).toBe('2');
    expect(parseSubmissionReceiptLineForPdf('0')).toBeUndefined();
    expect(parseSubmissionReceiptLineForPdf('9')).toBeUndefined();
  });
});

describe('generateReceiptPDF', () => {
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
    expect('receipts' in out && (out.receipts[0]?.raw_transcript?.length ?? 0)).toBeGreaterThan(100);
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
    const raw = '{ "vendor_name": "Partial", "raw_transcript": "broken';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ...geminiResponse(raw),
        text: async () => '',
      }),
    );
    const out = await extractReceiptData(new Uint8Array(20), 'image/jpeg', 'k');
    expect('receipts' in out && out.receipts[0]?.vendor_name).toBe('Partial');
  });
});

describe('receipt constants', () => {
  it('exports accepted types and max size', () => {
    expect(ACCEPTED_TYPES).toContain('image/png');
    expect(MAX_FILE_SIZE).toBeGreaterThan(0);
  });
});
