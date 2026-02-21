import { FileUpload } from '~/components/reimbursement/ui/FileUpload';
import { Button } from '~/components/reimbursement/ui/Button';
import { useFileUpload } from '~/hooks/useFileUpload';
import type { FileData } from '~/lib/reimbursement/validation';

interface FileUploadsProps {
  files: FileData[];
  onAddFile: (file: FileData) => void;
  onRemoveFile: (key: string) => void;
  onNext: () => void;
  onBack: () => void;
  turnstileToken: string | null;
  onResetTurnstile: () => void;
}

export function FileUploads({
  files,
  onAddFile,
  onRemoveFile,
  onNext,
  onBack,
  turnstileToken,
  onResetTurnstile,
}: FileUploadsProps) {
  const { uploadFile, clearUpload, uploads } = useFileUpload(turnstileToken, onResetTurnstile);

  const handleFileSelect = async (file: File) => {
    // Clear any failed uploads so the user gets a fresh state
    for (const upload of uploads) {
      if (upload.status === 'error') {
        clearUpload(upload.id);
      }
    }
    const results = await uploadFile(file);
    if (results) {
      for (const result of results) {
        onAddFile(result);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const activeUploads = uploads.filter((u) => u.status === 'uploading' || u.status === 'pending');
  const isUploading = activeUploads.length > 0;

  const maxFiles = 8;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-charcoal/10">
        <h2 className="text-xl font-semibold text-charcoal mb-2">Upload Receipts</h2>
        <p className="text-charcoal/70 mb-6">
          Upload images or PDFs of your receipts (optional, up to 4 receipts).
        </p>

        {files.length < maxFiles && (
          <FileUpload
            onFileSelect={handleFileSelect}
            label=""
            disabled={isUploading}
          />
        )}

        {/* Upload Progress */}
        {uploads.length > 0 && (
          <div className="mt-4 space-y-2" role="status" aria-live="polite">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className={`p-3 rounded-lg ${
                  upload.status === 'error' ? 'bg-red-50' : 'bg-eagle-blue/10'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium truncate">{upload.filename}</span>
                  <span className="text-sm text-charcoal/70">
                    {upload.status === 'uploading' && upload.progress <= 30 && 'Processing image...'}
                    {upload.status === 'uploading' && upload.progress > 30 && `${upload.progress}%`}
                    {upload.status === 'complete' && 'Complete'}
                    {upload.status === 'error' && 'Failed'}
                  </span>
                </div>
                {upload.status === 'uploading' && (
                  <div className="w-full bg-charcoal/10 rounded-full h-2">
                    <div
                      className="bg-eagle-blue h-2 rounded-full transition-all"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
                {upload.status === 'error' && (
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-red-600">{upload.error}</p>
                    <button
                      type="button"
                      onClick={() => clearUpload(upload.id)}
                      className="text-sm font-medium text-charcoal/70 hover:text-charcoal ml-3 shrink-0"
                      aria-label={`Dismiss error for ${upload.filename}`}
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Uploaded Files List */}
        {files.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-charcoal/80 mb-3">
              Uploaded Files ({files.length})
            </h3>
            <ul className="space-y-2">
              {files.map((file) => (
                <li
                  key={file.key}
                  className="flex items-center justify-between p-3 bg-warm-white rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-8 h-8 text-charcoal/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <a
                        href={`/api/reimbursement/file?key=${encodeURIComponent(file.key)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-eagle-blue hover:underline truncate max-w-xs block"
                      >
                        {file.filename}
                      </a>
                      <p className="text-xs text-charcoal/70">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveFile(file.key)}
                    aria-label={`Remove ${file.filename}`}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {files.length === 0 && uploads.length === 0 && (
          <p className="mt-4 text-sm text-charcoal/70 text-center">
            No files uploaded yet. You can continue without uploading files.
          </p>
        )}
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Next: Review'}
        </Button>
      </div>
    </form>
  );
}
