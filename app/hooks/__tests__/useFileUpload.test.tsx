/** @vitest-environment jsdom */
import {act, renderHook} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {useFileUpload} from '../useFileUpload';

interface ConvertReceiptResponse {
  jobId?: string;
  receiptUploadToken?: string;
  status?: string;
  original?: {
    key: string;
    filename: string;
    contentType: string;
    size: number;
    fileAccessExp?: number;
    fileAccessSig?: string;
  };
}

function buildSuccessResponse(jobId: string, withToken: boolean): ConvertReceiptResponse {
  return {
    jobId,
    status: 'queued',
    ...(withToken ? {receiptUploadToken: 'rt'} : {}),
    original: {
      key: `uploads/${jobId}.jpg`,
      filename: `${jobId}.jpg`,
      contentType: 'image/jpeg',
      size: 1234,
    },
  };
}

describe('useFileUpload', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns immediately for an empty batch without continuation token', async () => {
    const {result} = renderHook(() => useFileUpload('tok'));
    let out: unknown;
    await act(async () => {
      out = await result.current.uploadFilesBatch([], 0);
    });
    expect(out).toEqual([]);
  });

  it('marks upload error when fetch rejects a non-Error value', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('boom'));
    const {result} = renderHook(() => useFileUpload('tok'));
    const file = new File(['x'], 'a.jpg', {type: 'image/jpeg'});
    await act(async () => {
      await result.current.uploadFilesBatch([{file, id: 'u-ne'}], 0);
    });
    expect(result.current.uploads.find((u) => u.id === 'u-ne')?.error).toBe('Upload failed');
    vi.unstubAllGlobals();
  });

  it('uploads two files: first with turnstile, second with the continuation token', async () => {
    let posts = 0;
    const fetchMock = vi.fn().mockImplementation(() => {
      posts++;
      return Promise.resolve({
        ok: true,
        json: async () => buildSuccessResponse(`j${posts}`, posts === 1),
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const {result} = renderHook(() => useFileUpload('tok'));
    const f1 = new File(['a'], '1.jpg', {type: 'image/jpeg'});
    const f2 = new File(['b'], '2.jpg', {type: 'image/jpeg'});
    let pairs: unknown;
    await act(async () => {
      pairs = await result.current.uploadFilesBatch(
        [
          {file: f1, id: 'ok1'},
          {file: f2, id: 'ok2'},
        ],
        0,
      );
    });
    expect(result.current.uploads.every((u) => u.status === 'complete')).toBe(true);
    expect((pairs as Array<unknown>).every((p) => p !== null)).toBe(true);
  });

  it('clearReceiptUploadContinuation is a no-op safe call', () => {
    const {result} = renderHook(() => useFileUpload('tok'));
    act(() => {
      result.current.clearReceiptUploadContinuation();
    });
    expect(result.current.uploads).toEqual([]);
  });

  it('clearAllUploads is safe when there are no uploads', () => {
    const {result} = renderHook(() => useFileUpload('tok'));
    act(() => {
      result.current.clearAllUploads();
    });
    expect(result.current.uploads).toHaveLength(0);
  });

  it('uploads a single file with turnstile and resolves to the original FileData', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => buildSuccessResponse('job1', true),
    });
    vi.stubGlobal('fetch', fetchMock);

    const {result} = renderHook(() => useFileUpload('tok'));
    const file = new File(['x'], 'a.jpg', {type: 'image/jpeg'});
    let pairs: unknown;
    await act(async () => {
      pairs = await result.current.uploadFilesBatch([{file, id: 'u1'}], 0, 'Pat');
    });
    const out = pairs as Array<{key: string; jobId?: string} | null>;
    expect(out[0]).not.toBeNull();
    expect(out[0]?.jobId).toBe('job1');
    expect(out[0]?.key).toBe('uploads/job1.jpg');
  });

  it('uses continuation tokens for a second multi-file batch', async () => {
    let postCount = 0;
    const fetchMock = vi.fn().mockImplementation(() => {
      postCount++;
      return Promise.resolve({
        ok: true,
        json: async () => buildSuccessResponse(`j${postCount}`, postCount === 1),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const {result} = renderHook(() => useFileUpload('tok'));
    const f1 = new File(['a'], '1.jpg', {type: 'image/jpeg'});
    await act(async () => {
      await result.current.uploadFilesBatch([{file: f1, id: 'u1'}], 0);
    });
    const f2 = new File(['b'], '2.jpg', {type: 'image/jpeg'});
    const f3 = new File(['c'], '3.jpg', {type: 'image/jpeg'});
    await act(async () => {
      await result.current.uploadFilesBatch(
        [
          {file: f2, id: 'u2'},
          {file: f3, id: 'u3'},
        ],
        0,
      );
    });
    expect(postCount).toBeGreaterThanOrEqual(3);
  });

  it('returns empty array for zero-length batch when continuation is set', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => buildSuccessResponse('j1', true),
    });
    vi.stubGlobal('fetch', fetchMock);
    const {result} = renderHook(() => useFileUpload('tok'));
    const file = new File(['x'], 'a.jpg', {type: 'image/jpeg'});
    await act(async () => {
      await result.current.uploadFilesBatch([{file, id: 'u0'}], 0);
    });
    let empty: unknown;
    await act(async () => {
      empty = await result.current.uploadFilesBatch([], 0);
    });
    expect((empty as unknown[]).length).toBe(0);
  });

  it('marks error when convert-receipt response is missing the original payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({jobId: 'j1'}),
    });
    vi.stubGlobal('fetch', fetchMock);
    const {result} = renderHook(() => useFileUpload('tok'));
    const file = new File(['x'], 'a.jpg', {type: 'image/jpeg'});
    await act(async () => {
      await result.current.uploadFilesBatch([{file, id: 'u-bad'}], 0);
    });
    expect(result.current.uploads.some((u) => u.id === 'u-bad' && u.status === 'error')).toBe(true);
  });

  it('marks error when convert-receipt returns a non-OK status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({error: 'server exploded'}),
    });
    vi.stubGlobal('fetch', fetchMock);
    const {result} = renderHook(() => useFileUpload('tok'));
    const file = new File(['x'], 'a.jpg', {type: 'image/jpeg'});
    await act(async () => {
      await result.current.uploadFilesBatch([{file, id: 'u-poll'}], 0);
    });
    const errored = result.current.uploads.find((u) => u.id === 'u-poll');
    expect(errored?.status).toBe('error');
    expect(errored?.error).toBe('server exploded');
  });

  it('cancels remaining uploads when the first file in a multi-select fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({error: 'nope'}),
      ok: false,
      status: 400,
    });
    vi.stubGlobal('fetch', fetchMock);
    const {result} = renderHook(() => useFileUpload('tok'));
    const f1 = new File(['a'], '1.jpg', {type: 'image/jpeg'});
    const f2 = new File(['b'], '2.jpg', {type: 'image/jpeg'});
    await act(async () => {
      await result.current.uploadFilesBatch(
        [
          {file: f1, id: 'm1'},
          {file: f2, id: 'm2'},
        ],
        0,
      );
    });
    const msgs = result.current.uploads.map((u) => u.error);
    expect(msgs.some((m) => m?.includes('Canceled'))).toBe(true);
  });

  it('marks error when a follow-up upload fails after the first succeeds', async () => {
    let posts = 0;
    const fetchMock = vi.fn().mockImplementation(() => {
      posts++;
      if (posts === 1) {
        return Promise.resolve({
          ok: true,
          json: async () => buildSuccessResponse('j1', true),
        });
      }
      return Promise.resolve({json: async () => ({}), ok: false, status: 400});
    });
    vi.stubGlobal('fetch', fetchMock);
    const {result} = renderHook(() => useFileUpload('tok'));
    const f1 = new File(['a'], '1.jpg', {type: 'image/jpeg'});
    const f2 = new File(['b'], '2.jpg', {type: 'image/jpeg'});
    await act(async () => {
      await result.current.uploadFilesBatch(
        [
          {file: f1, id: 'x1'},
          {file: f2, id: 'x2'},
        ],
        0,
      );
    });
    expect(result.current.uploads.find((u) => u.id === 'x2')?.status).toBe('error');
  });
});
