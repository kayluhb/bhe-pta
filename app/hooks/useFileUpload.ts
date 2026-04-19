import {useCallback, useRef, useState} from 'react';
import type {FileData} from '~/lib/reimbursement/validation';

export interface UploadProgress {
  id: string;
  filename: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
  /** 0-based receipt row this upload belongs to (for inline progress UI). */
  receiptRowIndex: number;
}

export function useFileUpload(turnstileToken: string | null) {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());
  /** HMAC token from last successful convert-receipt; allows follow-up uploads without Turnstile. */
  const receiptUploadContinuationRef = useRef<string | null>(null);

  const pollJobUntilComplete = useCallback(async (jobId: string) => {
    const started = Date.now();
    const timeoutMs = 120_000;
    const pollMs = 1200;

    while (Date.now() - started < timeoutMs) {
      const statusResponse = await fetch(
        `/api/reimbursement/convert-receipt-status?jobId=${encodeURIComponent(jobId)}`,
      );
      if (!statusResponse.ok) {
        const errorData = (await statusResponse.json()) as {error?: string};
        throw new Error(errorData.error || 'Failed to check conversion status');
      }

      const status = (await statusResponse.json()) as
        | ({status: 'queued' | 'processing'} & Record<string, unknown>)
        | ({status: 'error'; error?: string} & Record<string, unknown>)
        | ({
            status: 'complete';
            key: string;
            filename: string;
            contentType: string;
            size: number;
            fileAccessExp?: number;
            fileAccessSig?: string;
            original?: FileData & {fileAccessExp?: number; fileAccessSig?: string};
          } & Record<string, unknown>);

      if (status.status === 'complete') {
        return status;
      }
      if (status.status === 'error') {
        throw new Error(status.error || 'Receipt conversion failed.');
      }

      await new Promise((resolve) => setTimeout(resolve, pollMs));
    }

    throw new Error('Receipt processing timed out. Please try again.');
  }, []);

  /** Show all files as pending before uploads (multi-select batch). */
  const registerPendingBatch = useCallback(
    (items: Array<{id: string; file: File}>, receiptRowIndex: number) => {
      setUploads((prev) => {
        const next = new Map(prev);
        for (const {id, file} of items) {
          next.set(id, {
            id,
            filename: file.name,
            progress: 0,
            status: 'pending',
            receiptRowIndex,
          });
        }
        return next;
      });
    },
    [],
  );

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

  const buildFileDataPair = useCallback(
    (
      result: Awaited<ReturnType<typeof pollJobUntilComplete>>,
      receiptLineIndex: number,
    ): FileData[] => {
      if (!result.original?.key) {
        throw new Error(
          'Upload did not return the original receipt file. Both the original and converted copy are required—please try again.',
        );
      }
      return [
        {
          key: result.key,
          filename: result.filename,
          contentType: result.contentType,
          size: result.size,
          receiptLineIndex,
          ...(result.fileAccessExp != null && result.fileAccessSig
            ? {fileAccessExp: result.fileAccessExp, fileAccessSig: result.fileAccessSig}
            : {}),
        },
        {
          ...result.original,
          receiptLineIndex,
          ...(result.original.fileAccessExp != null && result.original.fileAccessSig
            ? {
                fileAccessExp: result.original.fileAccessExp,
                fileAccessSig: result.original.fileAccessSig,
              }
            : {}),
        },
      ];
    },
    [],
  );

  /**
   * Upload many files in parallel after Turnstile (first POST only when no continuation token).
   * All conversion jobs poll concurrently.
   */
  const uploadFilesBatch = useCallback(
    async (
      items: Array<{id: string; file: File}>,
      receiptRowIndex: number,
      payableTo?: string,
    ): Promise<(FileData[] | null)[]> => {
      const receiptLineIndex = receiptRowIndex + 1;
      const out: (FileData[] | null)[] = items.map(() => null);

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

      const postOne = async (
        file: File,
        id: string,
        auth: 'turnstile' | 'continuation',
      ): Promise<string> => {
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
          throw new Error(errorData.error || 'Processing failed');
        }

        const queued = (await response.json()) as {jobId?: string; receiptUploadToken?: string};
        if (!queued.jobId) {
          throw new Error('Upload did not return a processing job. Please try again.');
        }
        if (queued.receiptUploadToken) {
          receiptUploadContinuationRef.current = queued.receiptUploadToken;
        }

        setProgress(id, file.name, 60, receiptRowIndex);
        return queued.jobId;
      };

      const jobIds: (string | undefined)[] = new Array(items.length);

      if (receiptUploadContinuationRef.current) {
        const settled = await Promise.allSettled(
          items.map(({file, id}) => postOne(file, id, 'continuation')),
        );
        settled.forEach((result, i) => {
          if (result.status === 'fulfilled') {
            jobIds[i] = result.value;
          } else {
            const msg = result.reason instanceof Error ? result.reason.message : 'Upload failed';
            markUploadError(items[i].id, items[i].file.name, receiptRowIndex, msg);
          }
        });
      } else if (items.length === 0) {
        return out;
      } else if (items.length === 1) {
        const {file, id} = items[0];
        try {
          jobIds[0] = await postOne(file, id, 'turnstile');
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Upload failed';
          markUploadError(id, file.name, receiptRowIndex, msg);
          return out;
        }
      } else {
        const {file, id} = items[0];
        try {
          jobIds[0] = await postOne(file, id, 'turnstile');
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Upload failed';
          markUploadError(id, file.name, receiptRowIndex, msg);
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

        const settled = await Promise.allSettled(
          items.slice(1).map(({file: f, id: uid}) => postOne(f, uid, 'continuation')),
        );
        settled.forEach((result, j) => {
          const idx = j + 1;
          if (result.status === 'fulfilled') {
            jobIds[idx] = result.value;
          } else {
            const msg = result.reason instanceof Error ? result.reason.message : 'Upload failed';
            markUploadError(items[idx].id, items[idx].file.name, receiptRowIndex, msg);
          }
        });
      }

      await Promise.allSettled(
        items.map(async ({id, file}, i) => {
          const jobId = jobIds[i];
          if (!jobId) return;
          try {
            const result = await pollJobUntilComplete(jobId);
            const pair = buildFileDataPair(result, receiptLineIndex);
            setUploads((prev) => {
              const next = new Map(prev);
              next.set(id, {
                id,
                filename: file.name,
                progress: 100,
                status: 'complete',
                receiptRowIndex,
              });
              return next;
            });
            out[i] = pair;
          } catch (error) {
            const msg = error instanceof Error ? error.message : 'Upload failed';
            markUploadError(id, file.name, receiptRowIndex, msg);
          }
        }),
      );

      return out;
    },
    [buildFileDataPair, markUploadError, pollJobUntilComplete, turnstileToken],
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
    registerPendingBatch,
    uploadFilesBatch,
    uploads: Array.from(uploads.values()),
  };
}
