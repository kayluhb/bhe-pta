import {useCallback, useState} from 'react';
import type {FileData} from '~/lib/reimbursement/validation';

interface UploadProgress {
  id: string;
  filename: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

export function useFileUpload(turnstileToken: string | null, onResetTurnstile?: () => void) {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());

  const uploadFile = useCallback(
    async (file: File, payableTo?: string, receiptNumber?: number): Promise<FileData[] | null> => {
      const id = crypto.randomUUID();

      setUploads((prev) => {
        const next = new Map(prev);
        next.set(id, {id, filename: file.name, progress: 0, status: 'pending'});
        return next;
      });

      try {
        // Send all files (images and PDFs) through the convert-receipt endpoint
        // for OCR text extraction and simple PDF generation
        setUploads((prev) => {
          const next = new Map(prev);
          next.set(id, {id, filename: file.name, progress: 30, status: 'uploading'});
          return next;
        });

        const formData = new FormData();
        formData.append('file', file);
        if (payableTo) formData.append('payableTo', payableTo);
        if (receiptNumber) formData.append('receiptNumber', String(receiptNumber));

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
          original?: FileData;
        };

        setUploads((prev) => {
          const next = new Map(prev);
          next.set(id, {id, filename: file.name, progress: 100, status: 'complete'});
          return next;
        });

        // Reset Turnstile so a fresh token is available for the next request
        onResetTurnstile?.();

        const files: FileData[] = [
          {
            key: result.key,
            filename: result.filename,
            contentType: result.contentType,
            size: result.size,
          },
        ];
        if (result.original) {
          files.push(result.original);
        }
        return files;
      } catch (error) {
        setUploads((prev) => {
          const next = new Map(prev);
          next.set(id, {
            id,
            filename: file.name,
            progress: 0,
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed',
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
