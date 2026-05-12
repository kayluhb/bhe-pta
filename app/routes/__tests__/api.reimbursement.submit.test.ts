import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('~/lib/reimbursement/pdf/generator', () => ({
  generatePDF: vi.fn(async () => new Uint8Array([1, 2, 3])),
}));

vi.mock('~/lib/reimbursement/submission-finalize', () => ({
  attachConvertedToSubmission: vi.fn(async () => ({ok: true as const, key: 'k'})),
  dispatchSubmissionEmail: vi.fn(async () => false),
  releaseEmailDispatchClaim: vi.fn(async () => {}),
  tryClaimEmailDispatch: vi.fn(async () => false),
}));

import {attachConvertedToSubmission} from '~/lib/reimbursement/submission-finalize';
import {action} from '../api.reimbursement.submit';

interface JobRow {
  id: string;
  status: 'queued' | 'processing' | 'complete' | 'error';
  original_key: string;
  original_filename: string;
  original_content_type: string;
  original_size: number;
  converted_key: string | null;
  converted_filename: string | null;
  converted_size: number | null;
  reimbursement_draft_id?: string | null;
  submission_id: string | null;
}

function buildBody(jobIds: string[]) {
  return {
    budget: {
      primaryAccount: 'General',
      splitAccounts: false,
    },
    files: [],
    receiptUploads: jobIds.map((jobId) => ({jobId, receiptLineIndex: 1})),
    receipts: [
      {
        clientKey: 'c1',
        date: '2026-04-29',
        description: 'Supplies',
        amount: 20,
        placeOfPurchase: 'Store',
        budgetAccount: 'General',
      },
    ],
    reimbursementDraftId: '1700000000000-00000000-0000-4000-8000-000000000001',
    requester: {
      payableTo: 'Pat Tester',
      email: 'pat@example.com',
      phone: '',
      address: '123 Main St',
      dateOfRequest: '2026-04-29',
      dateCheckNeeded: '2026-05-10',
      invoiceNumber: '',
    },
    turnstileToken: 'tok',
  };
}

function createDb(jobRows: JobRow[], claimOutcomes: number[]) {
  const claimQueue = [...claimOutcomes];
  const prepare = vi.fn((sql: string) => {
    if (sql.includes('FROM school_years') && sql.includes('is_default')) {
      return {
        bind: (..._args: unknown[]) => ({
          first: async () => ({id: '2025-26'}),
          run: async () => ({meta: {changes: 1}}),
        }),
        first: async () => ({id: '2025-26'}),
      };
    }
    if (sql.includes('FROM receipt_conversion_jobs WHERE id IN')) {
      return {
        bind: (..._args: unknown[]) => ({
          all: async () => ({results: jobRows}),
        }),
      };
    }
    if (sql.includes('UPDATE receipt_conversion_jobs') && sql.includes('WHERE id = ?')) {
      return {
        bind: (..._args: unknown[]) => ({
          run: async () => ({meta: {changes: claimQueue.shift() ?? 0}}),
        }),
      };
    }
    if (sql.includes('UPDATE receipt_conversion_jobs') && sql.includes('WHERE submission_id = ?')) {
      return {
        bind: (..._args: unknown[]) => ({
          run: async () => ({meta: {changes: 1}}),
        }),
      };
    }
    return {
      bind: (..._args: unknown[]) => ({
        run: async () => ({meta: {changes: 1}}),
      }),
    };
  });

  return {
    prepare,
    batch: vi.fn(async (_stmts: unknown[]) => []),
  };
}

describe('api.reimbursement.submit action', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        json: async () => ({success: true}),
      })),
    );
  });

  it('uses job-specific suffixes so same-line uploads do not collide', async () => {
    const job1 = '11111111-1111-4111-8111-111111111111';
    const job2 = '22222222-2222-4222-8222-222222222222';
    const db = createDb(
      [
        {
          id: job1,
          status: 'queued',
          original_key: 'uploads/a.jpg',
          original_filename: 'a.jpg',
          original_content_type: 'image/jpeg',
          original_size: 10,
          converted_key: null,
          converted_filename: null,
          converted_size: null,
          submission_id: null,
        },
        {
          id: job2,
          status: 'queued',
          original_key: 'uploads/b.jpg',
          original_filename: 'b.jpg',
          original_content_type: 'image/jpeg',
          original_size: 11,
          converted_key: null,
          converted_filename: null,
          converted_size: null,
          submission_id: null,
        },
      ],
      [1, 1],
    );

    const r2Put = vi.fn(async () => {});
    const r2 = {
      head: vi.fn(async () => ({})),
      get: vi.fn(async () => ({arrayBuffer: async () => new Uint8Array([1]).buffer})),
      put: r2Put,
    };

    const request = new Request('https://example.com/api/reimbursement/submit', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(buildBody([job1, job2])),
    });

    const response = await action({
      request,
      context: {
        cloudflare: {
          env: {
            R2_BUCKET: r2,
            REIMBURSEMENT_DB: db,
            TURNSTILE_SECRET_KEY: 'secret',
          },
        },
      },
    } as never);

    expect(response.status).toBe(200);
    const putKeys = (r2Put.mock.calls as unknown[][]).map((call) => String(call[0]));
    const receiptKeys = putKeys.filter(
      (k) => k.includes('-receipt-1-') && k.endsWith('-original.jpg'),
    );
    expect(receiptKeys).toHaveLength(2);
    expect(new Set(receiptKeys).size).toBe(2);
    expect(receiptKeys.some((k) => k.includes('-11111111-'))).toBe(true);
    expect(receiptKeys.some((k) => k.includes('-22222222-'))).toBe(true);
  });

  it('submits when staging original is gone but converted PDF exists (conversion finished early)', async () => {
    const job1 = '11111111-1111-4111-8111-111111111111';
    const db = createDb(
      [
        {
          id: job1,
          status: 'complete',
          original_key: 'uploads/a.jpg',
          original_filename: 'a.jpg',
          original_content_type: 'image/jpeg',
          original_size: 10,
          converted_key: 'uploads/a-converted.pdf',
          converted_filename: 'a-converted.pdf',
          converted_size: 99,
          reimbursement_draft_id: null,
          submission_id: null,
        },
      ],
      [1],
    );

    const r2Put = vi.fn(async () => {});
    const r2 = {
      head: vi.fn(async (key: string) => {
        if (key === 'uploads/a.jpg') return null;
        if (key === 'uploads/a-converted.pdf') return {};
        return {};
      }),
      get: vi.fn(async (key: string) => {
        if (key === 'uploads/a.jpg') return null;
        return {arrayBuffer: async () => new Uint8Array([1]).buffer};
      }),
      put: r2Put,
    };

    const request = new Request('https://example.com/api/reimbursement/submit', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(buildBody([job1])),
    });

    const response = await action({
      request,
      context: {
        cloudflare: {
          env: {
            R2_BUCKET: r2,
            REIMBURSEMENT_DB: db,
            TURNSTILE_SECRET_KEY: 'secret',
          },
        },
      },
    } as never);

    expect(response.status).toBe(200);
    const putKeys = (r2Put.mock.calls as unknown[][]).map((call) => String(call[0]));
    const receiptOriginalKeys = putKeys.filter(
      (k) => k.includes('-receipt-1-') && k.endsWith('-original.jpg'),
    );
    expect(receiptOriginalKeys).toHaveLength(0);
    expect(attachConvertedToSubmission).toHaveBeenCalled();
  });

  it('fails submission when any job cannot be atomically claimed', async () => {
    const job1 = '11111111-1111-4111-8111-111111111111';
    const job2 = '22222222-2222-4222-8222-222222222222';
    const db = createDb(
      [
        {
          id: job1,
          status: 'queued',
          original_key: 'uploads/a.jpg',
          original_filename: 'a.jpg',
          original_content_type: 'image/jpeg',
          original_size: 10,
          converted_key: null,
          converted_filename: null,
          converted_size: null,
          submission_id: null,
        },
        {
          id: job2,
          status: 'queued',
          original_key: 'uploads/b.jpg',
          original_filename: 'b.jpg',
          original_content_type: 'image/jpeg',
          original_size: 11,
          converted_key: null,
          converted_filename: null,
          converted_size: null,
          submission_id: null,
        },
      ],
      [1, 0],
    );

    const r2 = {
      head: vi.fn(async () => ({})),
      get: vi.fn(async () => ({arrayBuffer: async () => new Uint8Array([1]).buffer})),
      put: vi.fn(async () => {}),
    };

    const request = new Request('https://example.com/api/reimbursement/submit', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(buildBody([job1, job2])),
    });

    const response = await action({
      request,
      context: {
        cloudflare: {
          env: {
            R2_BUCKET: r2,
            REIMBURSEMENT_DB: db,
            TURNSTILE_SECRET_KEY: 'secret',
          },
        },
      },
    } as never);

    expect(response.status).toBe(409);
    const payload = (await response.json()) as {error?: string};
    expect(payload.error).toContain('claimed by another submission');
    expect(db.batch).not.toHaveBeenCalled();
  });

  it('returns schema guidance when database migrations are missing', async () => {
    const db = {
      prepare: vi.fn(() => {
        throw new Error('no such column: submission_id');
      }),
      batch: vi.fn(async (_stmts: unknown[]) => []),
    };
    const r2 = {
      head: vi.fn(async () => ({})),
      get: vi.fn(async () => ({arrayBuffer: async () => new Uint8Array([1]).buffer})),
      put: vi.fn(async () => {}),
    };

    const request = new Request('https://example.com/api/reimbursement/submit', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(buildBody(['11111111-1111-4111-8111-111111111111'])),
    });

    const response = await action({
      request,
      context: {
        cloudflare: {
          env: {
            R2_BUCKET: r2,
            REIMBURSEMENT_DB: db,
            TURNSTILE_SECRET_KEY: 'secret',
          },
        },
      },
    } as never);

    expect(response.status).toBe(503);
    const payload = (await response.json()) as {error?: string};
    expect(payload.error).toContain('Database schema is out of date');
  });
});
