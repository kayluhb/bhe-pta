import { useState, useCallback } from 'react';
import type { FileData } from '~/lib/reimbursement/validation';

interface UploadProgress {
  id: string;
  filename: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

export function useFileUpload() {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());

  const uploadFile = useCallback(async (file: File): Promise<FileData[] | null> => {
    const id = crypto.randomUUID();

    setUploads((prev) => {
      const next = new Map(prev);
      next.set(id, { id, filename: file.name, progress: 0, status: 'pending' });
      return next;
    });

    try {
      const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);

      if (isImage) {
        // Image: send to OCR endpoint for text extraction + PDF conversion
        setUploads((prev) => {
          const next = new Map(prev);
          next.set(id, { id, filename: file.name, progress: 30, status: 'uploading' });
          return next;
        });

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/reimbursement/ocr', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error || 'OCR processing failed');
        }

        const result = (await response.json()) as FileData & {
          original?: FileData;
        };

        setUploads((prev) => {
          const next = new Map(prev);
          next.set(id, { id, filename: file.name, progress: 100, status: 'complete' });
          return next;
        });

        const files: FileData[] = [
          { key: result.key, filename: result.filename, contentType: result.contentType, size: result.size },
        ];
        if (result.original) {
          files.push(result.original);
        }
        return files;
      }

      // PDF: use existing presign + direct upload flow
      const presignResponse = await fetch('/api/reimbursement/upload-presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      if (!presignResponse.ok) {
        const errorData = (await presignResponse.json()) as { error?: string };
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { uploadUrl, key } = (await presignResponse.json()) as { uploadUrl: string; key: string };

      setUploads((prev) => {
        const next = new Map(prev);
        next.set(id, { id, filename: file.name, progress: 0, status: 'uploading' });
        return next;
      });

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploads((prev) => {
              const next = new Map(prev);
              next.set(id, { id, filename: file.name, progress, status: 'uploading' });
              return next;
            });
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      setUploads((prev) => {
        const next = new Map(prev);
        next.set(id, { id, filename: file.name, progress: 100, status: 'complete' });
        return next;
      });

      return [{
        key,
        filename: file.name,
        contentType: file.type,
        size: file.size,
      }];
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
  }, []);

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
