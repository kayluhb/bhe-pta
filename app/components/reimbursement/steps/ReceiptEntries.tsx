import {Button} from '~/components/reimbursement/ui/Button';
import {Input} from '~/components/reimbursement/ui/Input';
import {useFileUpload} from '~/hooks/useFileUpload';
import type {FileData, ReceiptData} from '~/lib/reimbursement/validation';
import {ReceiptLineFiles} from './ReceiptLineFiles';

interface ReceiptEntriesProps {
  receipts: ReceiptData[];
  filesByReceipt: FileData[][];
  fileError?: string | null;
  onUpdate: (index: number, data: Partial<ReceiptData>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onAppendReceiptFiles: (receiptIndex: number, files: FileData[]) => boolean;
  onRemoveFileFromReceipt: (receiptIndex: number, key: string) => void;
  onNext: () => void;
  onBack: () => void;
  totalAmount: number;
  payableTo: string;
  turnstileToken: string | null;
  onResetTurnstile: () => void;
}

export function ReceiptEntries({
  receipts,
  filesByReceipt,
  fileError,
  onUpdate,
  onAdd,
  onRemove,
  onAppendReceiptFiles,
  onRemoveFileFromReceipt,
  onNext,
  onBack,
  totalAmount,
  payableTo,
  turnstileToken,
  onResetTurnstile,
}: ReceiptEntriesProps) {
  const {
    uploadFile,
    clearUpload,
    uploads,
    registerPendingBatch,
    clearReceiptUploadContinuation,
  } = useFileUpload(turnstileToken);

  const isAnyUploading = uploads.some((u) => u.status === 'uploading' || u.status === 'pending');
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
      <div className="bg-white p-6 rounded-lg shadow-sm border border-charcoal/10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-charcoal">Receipt Details</h2>
            <p className="text-charcoal/70 mt-1">
              Add up to 4 receipts. Attach a photo or PDF on each line (optional).
            </p>
          </div>
          <div aria-live="polite" className="text-right">
            <p className="text-sm text-charcoal/70">Total</p>
            <p className="text-2xl font-bold text-eagle-blue">{formatCurrency(totalAmount)}</p>
          </div>
        </div>

        <div className="space-y-6">
          {receipts.map((receipt, index) => (
            <div
              className="p-4 bg-warm-white rounded-lg border border-charcoal/10"
              key={receipt.clientKey ?? `receipt-${index}`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-charcoal">Receipt {index + 1}</h3>
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
                    onChange={(event) =>
                      onUpdate(index, {placeOfPurchase: event.target.value})
                    }
                    placeholder="Name of store or location of website"
                    value={receipt.placeOfPurchase || ''}
                  />
                  <p className="mt-1 text-xs text-charcoal/70">
                    Name of store or location of website.
                  </p>
                </div>
              </div>

              <ReceiptLineFiles
                clearUpload={clearUpload}
                disabled={isAnyUploading}
                onBatchUploadComplete={() => {
                  clearReceiptUploadContinuation();
                  onResetTurnstile();
                }}
                onRemoveFile={(key) => onRemoveFileFromReceipt(index, key)}
                onAppendRowFiles={(files) => onAppendReceiptFiles(index, files)}
                payableTo={payableTo}
                receiptRowIndex={index}
                registerPendingBatch={registerPendingBatch}
                remainingFileSlots={Math.max(0, 8 - totalAttachedFiles)}
                rowFiles={filesByReceipt[index] ?? []}
                rowUploads={uploads.filter((u) => u.receiptRowIndex === index)}
                uploadFile={uploadFile}
              />
            </div>
          ))}
        </div>

        {fileError && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200" role="alert">
            <p className="text-sm text-red-800">{fileError}</p>
          </div>
        )}

        {receipts.length < 4 && (
          <button
            className="mt-4 w-full py-3 border-2 border-dashed border-charcoal/20 rounded-lg text-charcoal/70 hover:border-eagle-blue hover:text-eagle-blue transition-colors"
            onClick={onAdd}
            type="button"
          >
            + Add Another Receipt
          </button>
        )}
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <input
          className="mt-0.5 h-4 w-4 rounded border-charcoal/20 text-eagle-blue focus:ring-eagle-blue"
          required
          type="checkbox"
        />
        <span className="text-sm text-charcoal/70">
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
