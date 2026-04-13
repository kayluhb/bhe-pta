import {useCallback, useId, useState} from 'react';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  accept?: string;
  maxSize?: number;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export function FileUpload({
  onFileSelect,
  accept = 'image/*,.pdf',
  maxSize = 10 * 1024 * 1024,
  label = 'Upload File',
  error,
  disabled = false,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const id = useId();
  const inputId = `${id}-file-input`;
  const errorId = `${id}-error`;

  const handleFiles = useCallback(
    (fileList: FileList) => {
      setLocalError(null);
      const valid: File[] = [];
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

      for (const file of Array.from(fileList)) {
        if (file.size > maxSize) {
          setLocalError(`File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
          return;
        }
        if (!allowedTypes.includes(file.type)) {
          setLocalError('Invalid file type. Allowed: JPEG, PNG, WebP, PDF');
          return;
        }
        valid.push(file);
      }

      if (valid.length > 0) {
        onFileSelect(valid);
      }
    },
    [maxSize, onFileSelect],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [disabled, handleFiles],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles],
  );

  const displayError = error || localError;

  return (
    <div className="w-full">
      {label && (
        <label
          className="block text-sm font-medium text-charcoal/80 mb-1 sr-only"
          htmlFor={inputId}
        >
          {label}
        </label>
      )}
      <div
        aria-label="File upload drop zone"
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive ? 'border-eagle-blue bg-eagle-blue/10' : 'border-charcoal/20'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-charcoal/40'} ${
          displayError ? 'border-red-500' : ''
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          accept={accept}
          aria-describedby={displayError ? errorId : undefined}
          aria-invalid={displayError ? true : undefined}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          disabled={disabled}
          id={inputId}
          multiple
          onChange={handleChange}
          type="file"
        />
        <svg
          aria-hidden="true"
          className="mx-auto h-12 w-12 text-charcoal/60"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
        <p className="mt-2 text-sm text-charcoal/70">
          <span className="font-medium text-eagle-blue">Click to upload</span> or drag and drop
        </p>
        <p className="mt-1 text-xs text-charcoal/60">
          PNG, JPG, WebP or PDF up to {Math.round(maxSize / 1024 / 1024)}MB
        </p>
      </div>
      {displayError && (
        <p className="mt-1 text-sm text-red-600" id={errorId} role="alert">
          {displayError}
        </p>
      )}
    </div>
  );
}
