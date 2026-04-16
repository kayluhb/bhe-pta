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

export type UploadFileOptions = {
  /** When set, this id was pre-registered as pending (e.g. multi-file batch). */
  uploadId?: string;
};

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

  /** Show all files as pending before sequential uploads (multi-select queue). */
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

  const uploadFile = useCallback(
    async (
      file: File,
      receiptRowIndex: number,
      payableTo?: string,
      options?: UploadFileOptions,
    ): Promise<FileData[] | null> => {
      const id = options?.uploadId ?? crypto.randomUUID();
      const receiptLineIndex = receiptRowIndex + 1;

      if (!options?.uploadId) {
        setUploads((prev) => {
          const next = new Map(prev);
          next.set(id, {
            id,
            filename: file.name,
            progress: 0,
            status: 'pending',
            receiptRowIndex,
          });
          return next;
        });
      }

      try {
        setUploads((prev) => {
          const next = new Map(prev);
          next.set(id, {
            id,
            filename: file.name,
            progress: 30,
            status: 'uploading',
            receiptRowIndex,
          });
          return next;
        });

        const formData = new FormData();
        formData.append('file', file);
        if (payableTo) formData.append('payableTo', payableTo);
        formData.append('receiptNumber', String(receiptLineIndex));

        const headers: Record<string, string> = {};
        if (receiptUploadContinuationRef.current) {
          headers['X-Receipt-Upload-Token'] = receiptUploadContinuationRef.current;
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

        setUploads((prev) => {
          const next = new Map(prev);
          next.set(id, {
            id,
            filename: file.name,
            progress: 60,
            status: 'uploading',
            receiptRowIndex,
          });
          return next;
        });

        const result = await pollJobUntilComplete(queued.jobId);

        if (!result.original?.key) {
          throw new Error(
            'Upload did not return the original receipt file. Both the original and converted copy are required—please try again.',
          );
        }

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
      } catch (error) {
        receiptUploadContinuationRef.current = null;
        setUploads((prev) => {
          const next = new Map(prev);
          next.set(id, {
            id,
            filename: file.name,
            progress: 0,
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed',
            receiptRowIndex,
          });
          return next;
        });
        return null;
      }
    },
    [pollJobUntilComplete, turnstileToken],
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
    uploadFile,
    registerPendingBatch,
    clearReceiptUploadContinuation,
    clearUpload,
    clearAllUploads,
    uploads: Array.from(uploads.values()),
  };
}
