import {useState} from 'react';
import {FileUpload} from '~/components/reimbursement/ui/FileUpload';
import type {UploadProgress} from '~/hooks/useFileUpload';
import type {FileData} from '~/lib/reimbursement/validation';

interface ReceiptLineFilesProps {
  receiptRowIndex: number;
  rowFiles: FileData[];
  rowUploads: UploadProgress[];
  registerPendingBatch: (items: Array<{id: string; file: File}>, receiptRowIndex: number) => void;
  uploadFilesBatch: (
    items: Array<{id: string; file: File}>,
    receiptRowIndex: number,
    payableTo?: string,
  ) => Promise<(FileData[] | null)[]>;
  clearUpload: (id: string) => void;
  onBatchUploadComplete: () => void;
  onAppendRowFiles: (files: FileData[]) => boolean;
  onRemoveFile: (key: string) => void;
  payableTo: string;
  disabled: boolean;
  remainingFileSlots: number;
}

function previewFileHref(file: FileData): string | null {
  if (
    file.fileAccessExp == null ||
    !file.fileAccessSig ||
    typeof file.fileAccessExp !== 'number'
  ) {
    return null;
  }
  const params = new URLSearchParams({
    key: file.key,
    exp: String(file.fileAccessExp),
    sig: file.fileAccessSig,
  });
  return `/api/reimbursement/file?${params.toString()}`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Stable pick so the same upload doesn't flicker copy on re-renders. */
function pickById(id: string, messages: readonly string[]) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return messages[Math.abs(h) % messages.length];
}

/** Stagger indeterminate bars so parallel uploads don't pulse in lockstep. */
function staggerDelayMs(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return Math.abs(h) % 550;
}

const QUEUED_COPY = [
  'In line behind the spirit wear order—almost your turn.',
  'Saving your spot in the receipt conga line.',
  'Queued like a silent-auction paddle. Hang tight.',
] as const;

const AI_ANALYSIS_COPY = [
  'Our volunteer AI is squinting at this like a bake-sale price list.',
  'Teaching a cloud robot PTA math—one line item at a time.',
  'The digital treasurer is reading the fine print. No humans were caffeinated for this step.',
  'Eagle-spirit machine learning is on the case. Spirit wear not required.',
  'Robo-Treasurer™ is cross-checking totals. The popsicle budget thanks you.',
  'Neural nets are doing the boring part so the real volunteers can do the fun part.',
] as const;

export function ReceiptLineFiles({
  receiptRowIndex,
  rowFiles,
  rowUploads,
  registerPendingBatch,
  uploadFilesBatch,
  clearUpload,
  onBatchUploadComplete,
  onAppendRowFiles,
  onRemoveFile,
  payableTo,
  disabled,
  remainingFileSlots,
}: ReceiptLineFilesProps) {
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const handleFileSelect = async (selectedFiles: File[]) => {
    setSelectionError(null);
    for (const upload of rowUploads) {
      if (upload.status === 'error') {
        clearUpload(upload.id);
      }
    }

    if (selectedFiles.length === 0) return;

    const maxUploadsAllowed = Math.floor(remainingFileSlots / 2);
    if (maxUploadsAllowed <= 0) {
      setSelectionError(
        'You have reached the limit (8 receipt images or PDFs; each upload stores 2 files). Remove a file before uploading more.',
      );
      return;
    }

    const filesToProcess =
      selectedFiles.length > maxUploadsAllowed ? selectedFiles.slice(0, maxUploadsAllowed) : selectedFiles;

    if (filesToProcess.length < selectedFiles.length) {
      setSelectionError(
        `Only ${filesToProcess.length} file(s) can be uploaded right now before hitting the 8-file limit.`,
      );
    }

    const slots = filesToProcess.map((file) => ({id: crypto.randomUUID(), file}));
    registerPendingBatch(slots, receiptRowIndex);

    const batchResults = await uploadFilesBatch(slots, receiptRowIndex, payableTo);

    const anyUploadFailed = batchResults.some((r) => r === null);
    const flatToAppend = batchResults.flatMap((r) => r ?? []);
    let hadError = anyUploadFailed;

    if (flatToAppend.length > 0) {
      if (!onAppendRowFiles(flatToAppend)) {
        setSelectionError(
          'You can attach up to 8 receipt images or PDFs total (each upload adds an original and a converted copy).',
        );
        hadError = true;
      }
    }

    if (!hadError) {
      onBatchUploadComplete();
    }
  };

  const rowBusy = rowUploads.some((u) => u.status === 'uploading' || u.status === 'pending');

  return (
    <div className="mt-4 pt-4 border-t border-charcoal/10">
      <h4 className="text-sm font-medium text-charcoal mb-2">Receipt attachment</h4>
      <p className="text-xs text-charcoal/70 mb-3">
        Upload one or more photos/PDFs for this line (optional). Files are added to this receipt.
      </p>

      <FileUpload
        disabled={disabled || rowBusy}
        label="Upload receipt image or PDF"
        multiple
        onFileSelect={handleFileSelect}
      />

      {selectionError && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2" role="alert">
          <p className="text-sm text-red-700">{selectionError}</p>
        </div>
      )}

      {rowUploads.length > 0 && (
        <div aria-live="polite" className="mt-3 space-y-2">
          {rowUploads.map((upload) => (
            <div
              className={`p-3 rounded-lg ${
                upload.status === 'error' ? 'bg-red-50' : 'bg-eagle-blue/10'
              }`}
              key={upload.id}
            >
              <div className="flex justify-between items-start gap-2 mb-1">
                <span className="text-sm font-medium truncate min-w-0">{upload.filename}</span>
                <span className="text-sm text-charcoal/70 shrink-0 text-right">
                  {upload.status === 'pending' && 'Queued'}
                  {upload.status === 'uploading' && upload.progress <= 30 && 'Uploading…'}
                  {upload.status === 'uploading' && upload.progress > 30 && upload.progress < 100 && (
                    <>
                      AI analysis
                      <span className="sr-only">; still working, no exact percentage available</span>
                    </>
                  )}
                  {upload.status === 'complete' && 'Complete'}
                  {upload.status === 'error' && 'Failed'}
                </span>
              </div>
              {upload.status === 'pending' && (
                <p className="text-xs text-charcoal/75 mb-2">
                  {pickById(upload.id, QUEUED_COPY)}
                </p>
              )}
              {upload.status === 'uploading' && upload.progress > 30 && upload.progress < 100 && (
                <p className="text-xs text-charcoal/75 mb-2">
                  {pickById(upload.id, AI_ANALYSIS_COPY)}
                </p>
              )}
              {upload.status === 'uploading' && upload.progress <= 30 && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-charcoal/10">
                  <div
                    className="h-2 rounded-full bg-eagle-blue transition-[width] duration-300 ease-out"
                    style={{width: `${upload.progress}%`}}
                  />
                </div>
              )}
              {upload.status === 'uploading' && upload.progress > 30 && upload.progress < 100 && (
                <div
                  aria-hidden="true"
                  className="relative h-2 w-full overflow-hidden rounded-full bg-charcoal/10"
                >
                  <div
                    className="receipt-upload-indeterminate-segment absolute top-0 left-0 h-full w-[42%] rounded-full bg-eagle-blue"
                    style={{animationDelay: `${staggerDelayMs(upload.id)}ms`}}
                  />
                </div>
              )}
              {upload.status === 'error' && (
                <div className="flex justify-between items-center">
                  <p className="text-sm text-red-600">{upload.error}</p>
                  <button
                    aria-label={`Dismiss error for ${upload.filename}`}
                    className="text-sm font-medium text-charcoal/70 hover:text-charcoal ml-3 shrink-0"
                    onClick={() => clearUpload(upload.id)}
                    type="button"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {rowFiles.length > 0 && (
        <ul className="mt-3 space-y-2">
          {rowFiles.map((file) => {
            const previewHref = previewFileHref(file);
            return (
            <li
              className="flex items-center justify-between p-2 bg-warm-white rounded-lg border border-charcoal/5"
              key={file.key}
            >
              <div className="flex items-center space-x-2 min-w-0">
                <svg
                  aria-hidden="true"
                  className="w-6 h-6 shrink-0 text-charcoal/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
                <div className="min-w-0">
                  {previewHref ? (
                    <a
                      className="text-sm font-medium text-eagle-blue hover:underline truncate block"
                      href={previewHref}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {file.filename}
                    </a>
                  ) : (
                    <span
                      className="text-sm font-medium text-charcoal/60 truncate block"
                      title="Re-upload this receipt to enable preview"
                    >
                      {file.filename}
                    </span>
                  )}
                  <p className="text-xs text-charcoal/70">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                aria-label={`Remove ${file.filename}`}
                className="text-red-600 hover:text-red-800 text-sm font-medium shrink-0"
                onClick={() => onRemoveFile(file.key)}
                type="button"
              >
                Remove
              </button>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
