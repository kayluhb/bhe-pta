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

  const uploadFile = useCallback(async (file: File): Promise<FileData | null> => {
    const id = crypto.randomUUID();

    setUploads((prev) => {
      const next = new Map(prev);
      next.set(id, {
        id,
        filename: file.name,
        progress: 0,
        status: 'pending',
      });
      return next;
    });

    try {
      // Step 1: Get presigned URL
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

      // Step 2: Upload to R2 with progress tracking
      setUploads((prev) => {
        const next = new Map(prev);
        next.set(id, {
          id,
          filename: file.name,
          progress: 0,
          status: 'uploading',
        });
        return next;
      });

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploads((prev) => {
              const next = new Map(prev);
              next.set(id, {
                id,
                filename: file.name,
                progress,
                status: 'uploading',
              });
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

      // Step 3: Mark complete
      setUploads((prev) => {
        const next = new Map(prev);
        next.set(id, {
          id,
          filename: file.name,
          progress: 100,
          status: 'complete',
        });
        return next;
      });

      return {
        key,
        filename: file.name,
        contentType: file.type,
        size: file.size,
      };
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
