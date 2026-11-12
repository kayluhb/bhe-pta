import {useState} from 'react';
import {Button} from '~/components/reimbursement/ui/Button';
import type {FormState} from '~/hooks/useFormState';

interface ReviewSubmitProps {
  data: FormState;
  totalAmount: number;
  onBack: () => void;
  onSubmit: (turnstileToken: string) => Promise<void>;
  getReceiptBudgetAccount: (index: number) => string;
  turnstileToken: string | null;
  onResetTurnstile: () => void;
}

export function ReviewSubmit({
  data,
  totalAmount,
  onBack,
  onSubmit,
  getReceiptBudgetAccount,
  turnstileToken,
  onResetTurnstile,
}: ReviewSubmitProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ackNoReceipts, setAckNoReceipts] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalFiles = data.filesByReceipt.reduce((sum, row) => sum + row.length, 0);
    if (totalFiles === 0 && !ackNoReceipts) {
      setError(
        'This request does not currently include any receipt files. Please either attach at least one receipt or check the box below to confirm you are submitting without receipts.',
      );
      return;
    }

    if (!turnstileToken) {
      setError('Please complete the verification challenge above.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(turnstileToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
      setIsSubmitting(false);
      onResetTurnstile();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-card border border-bhe-border bg-bhe-card p-6">
        <h2 className="font-display text-xl font-bold text-bhe-ink mb-6">Review your request</h2>

        {/* Requester Info */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-bhe-ink/70 uppercase tracking-wide mb-3">
            Payment details
          </h3>
          <dl className="bg-bhe-paper p-4 rounded-lg space-y-2 text-bhe-ink">
            <div>
              <dt className="inline font-medium text-bhe-ink/80">Payable to:</dt>{' '}
              <dd className="inline text-bhe-ink">{data.requester.payableTo}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-bhe-ink/80">Email:</dt>{' '}
              <dd className="inline text-bhe-ink">{data.requester.email}</dd>
            </div>
            {data.requester.phone && (
              <div>
                <dt className="inline font-medium text-bhe-ink/80">Phone:</dt>{' '}
                <dd className="inline text-bhe-ink">{data.requester.phone}</dd>
              </div>
            )}
            <div>
              <dt className="inline font-medium text-bhe-ink/80">Address:</dt>{' '}
              <dd className="inline text-bhe-ink">{data.requester.address}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-bhe-ink/80">Date of Request:</dt>{' '}
              <dd className="inline text-bhe-ink">{formatDate(data.requester.dateOfRequest)}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-bhe-ink/80">Date Check Needed:</dt>{' '}
              <dd className="inline text-bhe-ink">{formatDate(data.requester.dateCheckNeeded)}</dd>
            </div>
            {data.requester.invoiceNumber && (
              <div>
                <dt className="inline font-medium text-bhe-ink/80">Invoice #:</dt>{' '}
                <dd className="inline text-bhe-ink">{data.requester.invoiceNumber}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Budget Account */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-bhe-ink/70 uppercase tracking-wide mb-3">
            Budget Account
          </h3>
          <div className="bg-bhe-paper p-4 rounded-lg">
            <p className="font-medium text-bhe-ink">{data.budget.primaryAccount}</p>
            {data.budget.splitAccounts && (
              <p className="text-sm text-bhe-ink/70 mt-1">
                (Individual accounts assigned per receipt below)
              </p>
            )}
          </div>
        </div>

        {/* Receipts */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-bhe-ink/70 uppercase tracking-wide mb-3">
            Receipts ({data.receipts.length})
          </h3>
          <div className="space-y-3">
            {data.receipts.map((receipt, index) => {
              const rowFiles = data.filesByReceipt[index] ?? [];
              return (
                <div
                  className="bg-bhe-paper p-4 rounded-lg"
                  key={receipt.clientKey ?? `receipt-${index}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-bhe-ink">{receipt.description}</p>
                      <p className="text-sm text-bhe-ink/70">
                        {formatDate(receipt.date)}
                        {receipt.placeOfPurchase && ` • ${receipt.placeOfPurchase}`}
                      </p>
                      <p className="text-xs text-bhe-green mt-1">
                        Account: {getReceiptBudgetAccount(index)}
                      </p>
                    </div>
                    <p className="font-semibold text-bhe-ink ml-4">
                      {formatCurrency(receipt.amount)}
                    </p>
                  </div>
                  {rowFiles.length > 0 && (
                    <ul className="mt-3 pt-3 border-t border-bhe-border space-y-1">
                      {rowFiles.map((file) => (
                        <li className="flex items-center gap-2 text-sm text-bhe-ink" key={file.key}>
                          <svg
                            aria-hidden="true"
                            className="w-4 h-4 shrink-0 text-bhe-ink/70"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                            />
                          </svg>
                          <span>{file.filename}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <div className="text-right">
              <p className="text-sm text-bhe-ink/70">Total Amount</p>
              <p className="text-2xl font-bold text-bhe-green">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>

        {data.filesByReceipt.every((row) => row.length === 0) && (
          <div className="mb-6 p-4 bg-bhe-paper border border-bhe-border rounded-lg">
            <p className="text-sm text-bhe-ink/80">
              <strong>No receipt files are attached.</strong> Your request will not include any
              supporting receipts unless they appear in the list above.
            </p>
            <label className="mt-3 flex items-start gap-2">
              <input
                checked={ackNoReceipts}
                className="mt-0.5 h-4 w-4 rounded border-bhe-border text-bhe-green focus:ring-bhe-green"
                onChange={(e) => setAckNoReceipts(e.target.checked)}
                type="checkbox"
              />
              <span className="text-sm text-bhe-ink/70">
                I understand that no receipt files are attached to this request and wish to submit
                anyway.
              </span>
            </label>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="p-4 bg-bhe-green/10 border border-bhe-green/20 rounded-lg">
          <p className="text-sm text-bhe-green">
            By submitting this request, you confirm that all information is accurate and the
            expenses are eligible for PTA reimbursement.
            <br /> <strong>Sales tax cannot be reimbursed</strong> and should not be included.
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button disabled={isSubmitting} onClick={onBack} type="button" variant="outline">
          Back
        </Button>
        <Button isLoading={isSubmitting} type="submit">
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </div>
      {isSubmitting && (
        <p className="sr-only" role="status">
          Submitting reimbursement request…
        </p>
      )}
    </form>
  );
}
