import {beforeEach, describe, expect, it, vi} from 'vitest';

const extractReceiptData = vi.hoisted(() => vi.fn());
const generateReceiptPDF = vi.hoisted(() => vi.fn());

vi.mock('~/lib/reimbursement/receipt', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/lib/reimbursement/receipt')>();
  return {
    ...actual,
    extractReceiptData,
    generateReceiptPDF,
  };
});

import {processReceiptConversionJob} from '../receipt-conversion-queue';

describe('processReceiptConversionJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateReceiptPDF.mockReturnValue(new Uint8Array([1, 2, 3]));
  });

  it('no-ops when job row is missing', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const prepare = vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: async () => null,
        run: vi.fn(),
      }),
    });
    const env = {
      GEMINI_API_KEY: 'k',
      R2_BUCKET: {delete: vi.fn()},
      REIMBURSEMENT_DB: {prepare},
    } as unknown as Parameters<typeof processReceiptConversionJob>[0];
    await processReceiptConversionJob(env, {jobId: 'missing'});
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('marks error when original object is missing', async () => {
    const run = vi.fn().mockResolvedValue({});
    const row = {
      id: 'j1',
      original_content_type: 'image/jpeg',
      original_filename: 'a.jpg',
      original_key: 'uploads/1-00000000-0000-4000-8000-000000000001-a.jpg',
      original_size: 10,
      payable_to: 'Pat',
      receipt_number: '1',
      reimbursement_draft_id: null,
    };
    const prepare = vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: async () => row,
        run,
      }),
    });
    const get = vi.fn().mockResolvedValue(null);
    const env = {
      GEMINI_API_KEY: 'k',
      R2_BUCKET: {delete: vi.fn(), get},
      REIMBURSEMENT_DB: {prepare},
    } as unknown as Parameters<typeof processReceiptConversionJob>[0];

    await processReceiptConversionJob(env, {jobId: 'j1'});
    expect(run).toHaveBeenCalled();
  });

  it('completes happy path', async () => {
    extractReceiptData.mockResolvedValue({
      receipts: [{raw_transcript: 'x', total: '10'}],
    });

    const run = vi.fn().mockResolvedValue({});
    const row = {
      id: 'j2',
      original_content_type: 'image/jpeg',
      original_filename: 'doc.pdf',
      original_key: 'uploads/1-00000000-0000-4000-8000-000000000001-doc.pdf',
      original_size: 100,
      payable_to: 'Pat',
      receipt_number: '2',
      reimbursement_draft_id: '1700000000000-00000000-0000-4000-8000-000000000001',
    };
    const prepare = vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: async () => row,
        run,
      }),
    });
    const get = vi.fn().mockResolvedValue({
      arrayBuffer: async () => new Uint8Array([9, 9]).buffer,
    });
    const put = vi.fn().mockResolvedValue(undefined);
    const env = {
      GEMINI_API_KEY: 'k',
      R2_BUCKET: {delete: vi.fn(), get, put},
      REIMBURSEMENT_DB: {prepare},
    } as unknown as Parameters<typeof processReceiptConversionJob>[0];

    await processReceiptConversionJob(env, {jobId: 'j2'});
    expect(put).toHaveBeenCalled();
    const putKey = put.mock.calls[0]?.[0] as string;
    expect(putKey).toMatch(
      /^uploads\/pat-1700000000000-00000000-0000-4000-8000-000000000001-receipt-2-converted\.pdf$/,
    );
    expect(extractReceiptData).toHaveBeenCalled();
  });

  it('persists extractReceiptData errors', async () => {
    extractReceiptData.mockResolvedValue({error: 'bad', status: 422});

    const run = vi.fn().mockResolvedValue({});
    const row = {
      id: 'j3',
      original_content_type: 'image/jpeg',
      original_filename: 'a.jpg',
      original_key: 'uploads/1-00000000-0000-4000-8000-000000000001-a.jpg',
      original_size: 10,
      payable_to: null,
      receipt_number: null,
      reimbursement_draft_id: null,
    };
    const prepare = vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: async () => row,
        run,
      }),
    });
    const get = vi.fn().mockResolvedValue({
      arrayBuffer: async () => new Uint8Array([1]).buffer,
    });
    const env = {
      GEMINI_API_KEY: 'k',
      R2_BUCKET: {delete: vi.fn(), get, put: vi.fn()},
      REIMBURSEMENT_DB: {prepare},
    } as unknown as Parameters<typeof processReceiptConversionJob>[0];

    await processReceiptConversionJob(env, {jobId: 'j3'});
    expect(run).toHaveBeenCalled();
  });

  it('marks error when file bytes are empty', async () => {
    const run = vi.fn().mockResolvedValue({});
    const row = {
      id: 'j4',
      original_content_type: 'image/jpeg',
      original_filename: 'a.jpg',
      original_key: 'uploads/1-00000000-0000-4000-8000-000000000001-a.jpg',
      original_size: 0,
      payable_to: null,
      receipt_number: null,
      reimbursement_draft_id: null,
    };
    const prepare = vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: async () => row,
        run,
      }),
    });
    const get = vi.fn().mockResolvedValue({
      arrayBuffer: async () => new Uint8Array(0).buffer,
    });
    const env = {
      GEMINI_API_KEY: 'k',
      R2_BUCKET: {delete: vi.fn(), get, put: vi.fn()},
      REIMBURSEMENT_DB: {prepare},
    } as unknown as Parameters<typeof processReceiptConversionJob>[0];

    await processReceiptConversionJob(env, {jobId: 'j4'});
    expect(run).toHaveBeenCalled();
  });
});
