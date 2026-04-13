import {useCallback, useState} from 'react';
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

export function useFileUpload(turnstileToken: string | null, onResetTurnstile?: () => void) {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());

  const uploadFile = useCallback(
    async (file: File, receiptRowIndex: number, payableTo?: string): Promise<FileData[] | null> => {
      const id = crypto.randomUUID();
      const receiptLineIndex = receiptRowIndex + 1;

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

        const response = await fetch('/api/reimbursement/convert-receipt', {
          method: 'POST',
          headers: turnstileToken ? {'X-Turnstile-Token': turnstileToken} : {},
          body: formData,
        });

        if (!response.ok) {
          const errorData = (await response.json()) as {error?: string};
          throw new Error(errorData.error || 'Processing failed');
        }

        const result = (await response.json()) as FileData & {
          original?: FileData & {fileAccessExp?: number; fileAccessSig?: string};
          fileAccessExp?: number;
          fileAccessSig?: string;
        };

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

        onResetTurnstile?.();

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
    [turnstileToken, onResetTurnstile],
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
  }, []);

  return {
    uploadFile,
    clearUpload,
    clearAllUploads,
    uploads: Array.from(uploads.values()),
  };
}
