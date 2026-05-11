import {useCallback, useRef, useState} from 'react';
import type {FileData} from '~/lib/reimbursement/validation';

export interface UploadProgress {
  id: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  error?: string;
  /** 0-based receipt row this upload belongs to (for inline progress UI). */
  receiptRowIndex: number;
}

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

export function useFileUpload(turnstileToken: string | null) {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());
  /** HMAC token from last successful convert-receipt; allows follow-up uploads without Turnstile. */
  const receiptUploadContinuationRef = useRef<string | null>(null);

  const clearReceiptUploadContinuation = useCallback(() => {
    receiptUploadContinuationRef.current = null;
  }, []);

  const markUploadError = useCallback(
    (id: string, filename: string, receiptRowIndex: number, message: string) => {
      receiptUploadContinuationRef.current = null;
      setUploads((prev) => {
        const next = new Map(prev);
        next.set(id, {
          id,
          filename,
          progress: 0,
          status: 'error',
          error: message,
          receiptRowIndex,
        });
        return next;
      });
    },
    [],
  );

  /**
   * Upload many files in parallel after Turnstile (first POST only when no continuation token).
   * Each upload resolves to the original file's metadata; the converted PDF is attached
   * server-side once the queued conversion finishes.
   */
  const uploadFilesBatch = useCallback(
    async (
      items: Array<{id: string; file: File}>,
      receiptRowIndex: number,
      payableTo?: string,
    ): Promise<(FileData | null)[]> => {
      const receiptLineIndex = receiptRowIndex + 1;
      const out: (FileData | null)[] = items.map(() => null);

      const setProgress = (id: string, filename: string, progress: number, receiptRow: number) => {
        setUploads((prev) => {
          const next = new Map(prev);
          next.set(id, {
            id,
            filename,
            progress,
            status: 'uploading',
            receiptRowIndex: receiptRow,
          });
          return next;
        });
      };

      const markComplete = (id: string, filename: string, receiptRow: number) => {
        setUploads((prev) => {
          const next = new Map(prev);
          next.set(id, {
            id,
            filename,
            progress: 100,
            status: 'complete',
            receiptRowIndex: receiptRow,
          });
          return next;
        });
      };

      const postOne = async (
        file: File,
        id: string,
        auth: 'turnstile' | 'continuation',
      ): Promise<FileData> => {
        setProgress(id, file.name, 30, receiptRowIndex);

        const formData = new FormData();
        formData.append('file', file);
        if (payableTo) formData.append('payableTo', payableTo);
        formData.append('receiptNumber', String(receiptLineIndex));

        const headers: Record<string, string> = {};
        if (auth === 'continuation') {
          const token = receiptUploadContinuationRef.current;
          if (!token) {
            throw new Error('Verification required');
          }
          headers['X-Receipt-Upload-Token'] = token;
        } else if (turnstileToken) {
          headers['X-Turnstile-Token'] = turnstileToken;
        }

        const response = await fetch('/api/reimbursement/convert-receipt', {
          method: 'POST',
          headers,
          body: formData,
        });

        if (!response.ok) {
          const errorData = (await response.json()) as {error?: string};
          throw new Error(errorData.error || 'Upload failed');
        }

        const queued = (await response.json()) as ConvertReceiptResponse;
        if (!queued.jobId || !queued.original) {
          throw new Error('Upload did not return file metadata. Please try again.');
        }
        if (queued.receiptUploadToken) {
          receiptUploadContinuationRef.current = queued.receiptUploadToken;
        }

        markComplete(id, file.name, receiptRowIndex);

        return {
          key: queued.original.key,
          filename: queued.original.filename,
          contentType: queued.original.contentType,
          size: queued.original.size,
          receiptLineIndex,
          jobId: queued.jobId,
          ...(queued.original.fileAccessExp != null && queued.original.fileAccessSig
            ? {
                fileAccessExp: queued.original.fileAccessExp,
                fileAccessSig: queued.original.fileAccessSig,
              }
            : {}),
        };
      };

      if (receiptUploadContinuationRef.current) {
        const settled = await Promise.allSettled(
          items.map(({file, id}) => postOne(file, id, 'continuation')),
        );
        settled.forEach((result, i) => {
          if (result.status === 'fulfilled') {
            out[i] = result.value;
          } else {
            const msg = result.reason instanceof Error ? result.reason.message : 'Upload failed';
            markUploadError(items[i].id, items[i].file.name, receiptRowIndex, msg);
          }
        });
        return out;
      }

      if (items.length === 0) {
        return out;
      }

      // First upload runs Turnstile; remaining uploads use the continuation token.
      const {file: firstFile, id: firstId} = items[0];
      try {
        out[0] = await postOne(firstFile, firstId, 'turnstile');
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Upload failed';
        markUploadError(firstId, firstFile.name, receiptRowIndex, msg);
        for (let j = 1; j < items.length; j++) {
          markUploadError(
            items[j].id,
            items[j].file.name,
            receiptRowIndex,
            'Canceled because an earlier upload failed.',
          );
        }
        return out;
      }

      if (items.length === 1) {
        return out;
      }

      const settled = await Promise.allSettled(
        items.slice(1).map(({file: f, id: uid}) => postOne(f, uid, 'continuation')),
      );
      settled.forEach((result, j) => {
        const idx = j + 1;
        if (result.status === 'fulfilled') {
          out[idx] = result.value;
        } else {
          const msg = result.reason instanceof Error ? result.reason.message : 'Upload failed';
          markUploadError(items[idx].id, items[idx].file.name, receiptRowIndex, msg);
        }
      });

      return out;
    },
    [markUploadError, turnstileToken],
  );

  const clearUpload = useCallback((id: string) => {
    setUploads((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clearAllUploads = useCallback(() => {
    setUploads(new Map());
    receiptUploadContinuationRef.current = null;
  }, []);

  return {
    clearAllUploads,
    clearReceiptUploadContinuation,
    clearUpload,
    uploadFilesBatch,
    uploads: Array.from(uploads.values()),
  };
}
