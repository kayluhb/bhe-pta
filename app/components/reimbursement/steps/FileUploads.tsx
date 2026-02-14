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
}

export function FileUploads({
  files,
  onAddFile,
  onRemoveFile,
  onNext,
  onBack,
}: FileUploadsProps) {
  const { uploadFile, uploads } = useFileUpload();

  const handleFileSelect = async (file: File) => {
    const result = await uploadFile(file);
    if (result) {
      onAddFile(result);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-charcoal/10">
        <h2 className="text-xl font-semibold text-charcoal mb-2">Upload Receipts</h2>
        <p className="text-charcoal/60 mb-6">
          Upload images or PDFs of your receipts (optional, up to 4 files).
        </p>

        {files.length < 4 && (
          <FileUpload
            onFileSelect={handleFileSelect}
            label=""
            disabled={isUploading || files.length >= 4}
          />
        )}

        {/* Upload Progress */}
        {uploads.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className={`p-3 rounded-lg ${
                  upload.status === 'error' ? 'bg-red-50' : 'bg-eagle-blue/10'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium truncate">{upload.filename}</span>
                  <span className="text-sm text-charcoal/50">
                    {upload.status === 'uploading' && `${upload.progress}%`}
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
                  <p className="text-sm text-red-600">{upload.error}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Uploaded Files List */}
        {files.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-charcoal/80 mb-3">
              Uploaded Files ({files.length}/4)
            </h3>
            <ul className="space-y-2">
              {files.map((file) => (
                <li
                  key={file.key}
                  className="flex items-center justify-between p-3 bg-warm-white rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-8 h-8 text-charcoal/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-charcoal truncate max-w-xs">
                        {file.filename}
                      </p>
                      <p className="text-xs text-charcoal/50">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveFile(file.key)}
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
          <p className="mt-4 text-sm text-charcoal/50 text-center">
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
