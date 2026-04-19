/** @vitest-environment jsdom */
import {act, renderHook} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {useFileUpload} from '../useFileUpload';

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

  it('uploads two files on the first request using turnstile then continuation', async () => {
    let posts = 0;
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('convert-receipt') && !url.includes('status')) {
        posts++;
        if (posts === 1) {
          return Promise.resolve({
            ok: true,
            json: async () => ({jobId: 'j1', receiptUploadToken: 'rt'}),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({jobId: `j${posts}`}),
        });
      }
      const id = new URL(url, 'https://x.test').searchParams.get('jobId') ?? 'j1';
      return Promise.resolve({
        json: async () => ({
          contentType: 'application/pdf',
          filename: `${id}.pdf`,
          key: id,
          original: {
            contentType: 'image/jpeg',
            filename: 'o.jpg',
            key: `o-${id}`,
            receiptLineIndex: 1,
            size: 2,
          },
          size: 9,
          status: 'complete',
        }),
        ok: true,
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const {result} = renderHook(() => useFileUpload('tok'));
    const f1 = new File(['a'], '1.jpg', {type: 'image/jpeg'});
    const f2 = new File(['b'], '2.jpg', {type: 'image/jpeg'});
    await act(async () => {
      await result.current.uploadFilesBatch(
        [
          {file: f1, id: 'ok1'},
          {file: f2, id: 'ok2'},
        ],
        0,
      );
    });
    expect(result.current.uploads.every((u) => u.status === 'complete')).toBe(true);
  });

  it('clearReceiptUploadContinuation is a no-op safe call', () => {
    const {result} = renderHook(() => useFileUpload('tok'));
    act(() => {
      result.current.clearReceiptUploadContinuation();
    });
    expect(result.current.uploads).toEqual([]);
  });

  it('clears one pending upload via clearUpload', () => {
    const {result} = renderHook(() => useFileUpload('tok'));
    const file = new File(['x'], 'a.jpg', {type: 'image/jpeg'});
    act(() => {
      result.current.registerPendingBatch(
        [
          {file, id: '1'},
          {file, id: '2'},
        ],
        0,
      );
      result.current.clearUpload('1');
    });
    expect(result.current.uploads.map((u) => u.id)).toEqual(['2']);
  });

  it('registerPendingBatch tracks uploads and clearAllUploads clears', () => {
    const {result} = renderHook(() => useFileUpload('tok'));
    const file = new File(['x'], 'a.jpg', {type: 'image/jpeg'});
    act(() => {
      result.current.registerPendingBatch([{file, id: '1'}], 0);
    });
    expect(result.current.uploads).toHaveLength(1);
    act(() => {
      result.current.clearAllUploads();
    });
    expect(result.current.uploads).toHaveLength(0);
  });

  it('uploads a single file with turnstile and polls to completion', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock
      .mockResolvedValueOnce({
        json: async () => ({jobId: 'job1', receiptUploadToken: 'cont'}),
        ok: true,
      })
      .mockResolvedValue({
        json: async () => ({
          contentType: 'application/pdf',
          filename: 'c.pdf',
          key: 'k',
          original: {
            contentType: 'image/jpeg',
            filename: 'a.jpg',
            key: 'orig',
            receiptLineIndex: 1,
            size: 2,
          },
          size: 9,
          status: 'complete',
        }),
        ok: true,
      });

    const {result} = renderHook(() => useFileUpload('tok'));
    const file = new File(['x'], 'a.jpg', {type: 'image/jpeg'});
    let pairs: unknown;
    await act(async () => {
      pairs = await result.current.uploadFilesBatch([{file, id: 'u1'}], 0, 'Pat');
    });
    expect((pairs as (unknown[] | null)[])[0]).toHaveLength(2);
  });

  it('uses continuation tokens for a second multi-file batch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    let postCount = 0;
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('convert-receipt') && !url.includes('status')) {
        postCount++;
        if (postCount === 1) {
          return Promise.resolve({
            ok: true,
            json: async () => ({jobId: 'j1', receiptUploadToken: 'rt'}),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({jobId: `j${postCount}`}),
        });
      }
      const id = new URL(url, 'https://x.test').searchParams.get('jobId') ?? 'j1';
      return Promise.resolve({
        ok: true,
        json: async () => ({
          contentType: 'application/pdf',
          filename: `${id}.pdf`,
          key: id,
          original: {
            contentType: 'image/jpeg',
            filename: 'o.jpg',
            key: `o-${id}`,
            receiptLineIndex: 1,
            size: 2,
          },
          size: 5,
          status: 'complete',
        }),
      });
    });

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
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock
      .mockResolvedValueOnce({
        json: async () => ({jobId: 'j1', receiptUploadToken: 'rt'}),
        ok: true,
      })
      .mockResolvedValue({
        json: async () => ({
          contentType: 'application/pdf',
          filename: 'c.pdf',
          key: 'k',
          original: {
            contentType: 'image/jpeg',
            filename: 'a.jpg',
            key: 'orig',
            receiptLineIndex: 1,
            size: 2,
          },
          size: 9,
          status: 'complete',
        }),
        ok: true,
      });
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

  it('marks error when conversion payload is missing original key', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock
      .mockResolvedValueOnce({
        json: async () => ({jobId: 'j1'}),
        ok: true,
      })
      .mockResolvedValue({
        json: async () => ({
          contentType: 'application/pdf',
          filename: 'c.pdf',
          key: 'k',
          original: {contentType: 'image/jpeg', filename: 'a.jpg', key: '', size: 1},
          size: 9,
          status: 'complete',
        }),
        ok: true,
      });
    const {result} = renderHook(() => useFileUpload('tok'));
    const file = new File(['x'], 'a.jpg', {type: 'image/jpeg'});
    await act(async () => {
      await result.current.uploadFilesBatch([{file, id: 'u-bad'}], 0);
    });
    expect(result.current.uploads.some((u) => u.id === 'u-bad' && u.status === 'error')).toBe(true);
  });

  it('marks error when status poll HTTP fails', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock
      .mockResolvedValueOnce({
        json: async () => ({jobId: 'j1'}),
        ok: true,
      })
      .mockResolvedValue({json: async () => ({error: 'nope'}), ok: false, status: 500});
    const {result} = renderHook(() => useFileUpload('tok'));
    const file = new File(['x'], 'a.jpg', {type: 'image/jpeg'});
    await act(async () => {
      await result.current.uploadFilesBatch([{file, id: 'u-poll'}], 0);
    });
    expect(result.current.uploads.some((u) => u.id === 'u-poll' && u.status === 'error')).toBe(
      true,
    );
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
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('convert-receipt') && !url.includes('status')) {
        posts++;
        if (posts === 1) {
          return Promise.resolve({
            ok: true,
            json: async () => ({jobId: 'j1', receiptUploadToken: 'rt'}),
          });
        }
        return Promise.resolve({json: async () => ({}), ok: false, status: 400});
      }
      return Promise.resolve({
        json: async () => ({
          contentType: 'application/pdf',
          filename: 'c.pdf',
          key: 'k',
          original: {
            contentType: 'image/jpeg',
            filename: 'o.jpg',
            key: 'ok',
            receiptLineIndex: 1,
            size: 2,
          },
          size: 9,
          status: 'complete',
        }),
        ok: true,
      });
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

  it('marks error when conversion fails during polling', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock
      .mockResolvedValueOnce({
        json: async () => ({jobId: 'job2'}),
        ok: true,
      })
      .mockResolvedValue({
        json: async () => ({error: 'nope', status: 'error'}),
        ok: true,
      });

    const {result} = renderHook(() => useFileUpload('tok'));
    const file = new File(['x'], 'b.jpg', {type: 'image/jpeg'});
    await act(async () => {
      await result.current.uploadFilesBatch([{file, id: 'u2'}], 0);
    });
    expect(result.current.uploads.some((u) => u.id === 'u2' && u.status === 'error')).toBe(true);
  });
});
