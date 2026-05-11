import {beforeEach, describe, expect, it, vi} from 'vitest';

import * as generator from '../generator';
import {regenerateStoredSubmissionPdf} from '../regenerate-stored-pdf';

describe('regenerateStoredSubmissionPdf', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns no_r2 when bucket missing', async () => {
    const db = {} as D1Database;
    const out = await regenerateStoredSubmissionPdf(db, undefined, 'x');
    expect(out).toEqual({ok: false, reason: 'no_r2'});
  });

  it('returns not_found when submission missing', async () => {
    const db = {
      prepare: () => ({
        bind: () => ({
          first: async () => null,
        }),
      }),
    } as unknown as D1Database;
    const r2 = {delete: vi.fn(), put: vi.fn()} as unknown as R2Bucket;
    const out = await regenerateStoredSubmissionPdf(db, r2, 'missing');
    expect(out).toEqual({ok: false, reason: 'not_found'});
  });

  it('uploads a new PDF and updates the row', async () => {
    const run = vi.fn().mockResolvedValue({});
    const submissionRow = {
      check_amount: null,
      check_number: null,
      date_approved: null,
      date_paid: null,
      id: 's1',
      pdf_key: 'submissions/s1/old.pdf',
      requester_email: 'a@bheeagles.com',
      requester_name: 'Pat Example',
      requester_phone: null,
      submitted_at: '2026-04-01T00:00:00Z',
      total_amount: 20,
    };
    const receiptRows = {
      results: [
        {
          amount: 20,
          category: 'Library',
          description: 'Books',
          receipt_date: '2026-04-01',
          vendor: null,
        },
      ],
    };

    const prepare = vi.fn().mockImplementation((sql: string) => ({
      bind: vi.fn().mockReturnValue({
        all: async () => receiptRows,
        first: async () => {
          if (sql.includes('FROM submissions')) return submissionRow;
          return null;
        },
        run,
      }),
    }));

    const db = {prepare} as unknown as D1Database;
    const put = vi.fn().mockResolvedValue(undefined);
    const del = vi.fn().mockResolvedValue(undefined);
    const r2 = {delete: del, put} as unknown as R2Bucket;

    const out = await regenerateStoredSubmissionPdf(db, r2, 's1');
    expect(out).toEqual({ok: true, pdfKey: expect.stringContaining('submissions/s1/')});
    expect(put).toHaveBeenCalled();
    expect(del).toHaveBeenCalledWith('submissions/s1/old.pdf');
    expect(run).toHaveBeenCalled();
  });

  it('returns generate_failed when PDF generation throws', async () => {
    vi.spyOn(generator, 'generatePDF').mockRejectedValueOnce(new Error('pdf boom'));
    const run = vi.fn().mockResolvedValue({});
    const submissionRow = {
      check_amount: null,
      check_number: null,
      date_approved: null,
      date_paid: null,
      id: 's2',
      pdf_key: null,
      requester_email: 'a@bheeagles.com',
      requester_name: 'Pat',
      requester_phone: null,
      submitted_at: '2026-04-02T00:00:00Z',
      total_amount: 1,
    };
    const db = {
      prepare: () => ({
        bind: () => ({
          all: async () => ({results: []}),
          first: async () => submissionRow,
          run,
        }),
      }),
    } as unknown as D1Database;
    const r2 = {delete: vi.fn(), put: vi.fn()} as unknown as R2Bucket;
    const out = await regenerateStoredSubmissionPdf(db, r2, 's2');
    expect(out).toEqual({
      ok: false,
      message: 'pdf boom',
      reason: 'generate_failed',
    });
  });
});
