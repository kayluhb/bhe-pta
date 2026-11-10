import {Button} from '~/components/reimbursement/ui/Button';
import {Input} from '~/components/reimbursement/ui/Input';
import {useFileUpload} from '~/hooks/useFileUpload';
import type {FileData, ReceiptData} from '~/lib/reimbursement/validation';
import {MAX_RECEIPT_LINES, MAX_RECEIPT_UPLOADS} from '~/lib/reimbursement/validation';
import {ReceiptLineFiles} from './ReceiptLineFiles';

interface ReceiptEntriesProps {
  fileError?: string | null;
  filesByReceipt: FileData[][];
  onAdd: () => void;
  onAppendReceiptFiles: (receiptIndex: number, files: FileData[]) => boolean;
  onBack: () => void;
  onNext: () => void;
  onRemove: (index: number) => void;
  onRemoveFileFromReceipt: (receiptIndex: number, key: string) => void;
  onResetTurnstile: () => void;
  onUpdate: (index: number, data: Partial<ReceiptData>) => void;
  payableTo: string;
  receipts: ReceiptData[];
  reimbursementDraftId: string;
  totalAmount: number;
  turnstileToken: string | null;
}

export function ReceiptEntries({
  fileError,
  filesByReceipt,
  onAdd,
  onAppendReceiptFiles,
  onBack,
  onNext,
  onRemove,
  onRemoveFileFromReceipt,
  onResetTurnstile,
  onUpdate,
  payableTo,
  receipts,
  reimbursementDraftId,
  totalAmount,
  turnstileToken,
}: ReceiptEntriesProps) {
  const {clearReceiptUploadContinuation, clearUpload, uploadFilesBatch, uploads} =
    useFileUpload(turnstileToken);

  const isAnyUploading = uploads.some((u) => u.status === 'uploading');
  const totalAttachedFiles = filesByReceipt.reduce((sum, row) => sum + row.length, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-card border border-bhe-border bg-bhe-card p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-bhe-ink">What did you buy?</h2>
            <p className="text-bhe-ink/70 mt-1">
              Add a row for each reimbursement line. Attach a photo or PDF on each row (optional).
              You can attach up to {MAX_RECEIPT_UPLOADS} files total across all rows.
            </p>
          </div>
          <div aria-live="polite" className="text-right">
            <p className="text-sm text-bhe-ink/70">Total</p>
            <p className="text-2xl font-bold text-bhe-green">{formatCurrency(totalAmount)}</p>
          </div>
        </div>

        <div className="space-y-6">
          {receipts.map((receipt, index) => (
            <div
              className="p-4 bg-bhe-paper rounded-lg border border-bhe-border"
              key={receipt.clientKey ?? `receipt-${index}`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-bhe-ink">Receipt {index + 1}</h3>
                {receipts.length > 1 && (
                  <button
                    aria-label={`Remove Receipt ${index + 1}`}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                    onClick={() => onRemove(index)}
                    type="button"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Date of Purchase"
                  onChange={(event) => onUpdate(index, {date: event.target.value})}
                  required
                  type="date"
                  value={receipt.date}
                />

                <Input
                  label="Amount to Reimburse"
                  min="0"
                  onChange={(event) =>
                    onUpdate(index, {amount: Number.parseFloat(event.target.value) || 0})
                  }
                  placeholder="0.00"
                  required
                  step="0.01"
                  type="number"
                  value={receipt.amount || ''}
                />

                <div className="md:col-span-2">
                  <Input
                    label="Description"
                    onChange={(event) => onUpdate(index, {description: event.target.value})}
                    placeholder="What was purchased?"
                    required
                    value={receipt.description}
                  />
                </div>

                <div className="md:col-span-2">
                  <Input
                    label="Place of Purchase"
                    onChange={(event) => onUpdate(index, {placeOfPurchase: event.target.value})}
                    placeholder="Name of store or location of website"
                    value={receipt.placeOfPurchase || ''}
                  />
                  <p className="mt-1 text-xs text-bhe-ink/70">
                    Name of store or location of website.
                  </p>
                </div>
              </div>

              <ReceiptLineFiles
                clearUpload={clearUpload}
                disabled={isAnyUploading}
                onAppendRowFiles={(files) => onAppendReceiptFiles(index, files)}
                onBatchUploadComplete={() => {
                  clearReceiptUploadContinuation();
                  onResetTurnstile();
                }}
                onRemoveFile={(key) => onRemoveFileFromReceipt(index, key)}
                payableTo={payableTo}
                receiptRowIndex={index}
                reimbursementDraftId={reimbursementDraftId}
                remainingFileSlots={Math.max(0, MAX_RECEIPT_UPLOADS - totalAttachedFiles)}
                rowFiles={filesByReceipt[index] ?? []}
                rowUploads={uploads.filter((u) => u.receiptRowIndex === index)}
                uploadFilesBatch={uploadFilesBatch}
              />
            </div>
          ))}
        </div>

        {fileError && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200" role="alert">
            <p className="text-sm text-red-800">{fileError}</p>
          </div>
        )}

        {receipts.length < MAX_RECEIPT_LINES && (
          <button
            className="mt-4 w-full py-3 border-2 border-dashed border-bhe-border rounded-lg text-bhe-ink/70 hover:border-bhe-green hover:text-bhe-green transition-colors"
            onClick={onAdd}
            type="button"
          >
            + Add Another Receipt
          </button>
        )}
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <input
          className="mt-0.5 h-4 w-4 rounded border-bhe-border text-bhe-green focus:ring-bhe-green"
          required
          type="checkbox"
        />
        <span className="text-sm text-bhe-ink/70">
          I confirm my amounts <strong>do not include sales tax</strong>. Sales tax cannot be
          reimbursed.
        </span>
      </label>

      <div className="flex justify-between">
        <Button onClick={onBack} type="button" variant="outline">
          Back
        </Button>
        <Button disabled={isAnyUploading || !!fileError} type="submit">
          {isAnyUploading ? 'Uploading...' : 'Next: Budget Account'}
        </Button>
      </div>
    </form>
  );
}
