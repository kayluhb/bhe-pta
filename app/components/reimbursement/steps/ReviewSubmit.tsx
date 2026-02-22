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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      <div className="bg-white p-6 rounded-lg shadow-sm border border-charcoal/10">
        <h2 className="text-xl font-semibold text-charcoal mb-6">Review Your Request</h2>

        {/* Requester Info */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-charcoal/70 uppercase tracking-wide mb-3">
            Check Request Information
          </h3>
          <dl className="bg-warm-white p-4 rounded-lg space-y-2 text-charcoal">
            <div>
              <dt className="inline font-medium text-charcoal/80">Payable to:</dt>{' '}
              <dd className="inline text-charcoal">{data.requester.payableTo}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-charcoal/80">Email:</dt>{' '}
              <dd className="inline text-charcoal">{data.requester.email}</dd>
            </div>
            {data.requester.phone && (
              <div>
                <dt className="inline font-medium text-charcoal/80">Phone:</dt>{' '}
                <dd className="inline text-charcoal">{data.requester.phone}</dd>
              </div>
            )}
            <div>
              <dt className="inline font-medium text-charcoal/80">Address:</dt>{' '}
              <dd className="inline text-charcoal">{data.requester.address}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-charcoal/80">Date of Request:</dt>{' '}
              <dd className="inline text-charcoal">{formatDate(data.requester.dateOfRequest)}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-charcoal/80">Date Check Needed:</dt>{' '}
              <dd className="inline text-charcoal">{formatDate(data.requester.dateCheckNeeded)}</dd>
            </div>
            {data.requester.invoiceNumber && (
              <div>
                <dt className="inline font-medium text-charcoal/80">Invoice #:</dt>{' '}
                <dd className="inline text-charcoal">{data.requester.invoiceNumber}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Budget Account */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-charcoal/70 uppercase tracking-wide mb-3">
            Budget Account
          </h3>
          <div className="bg-warm-white p-4 rounded-lg">
            <p className="font-medium text-charcoal">{data.budget.primaryAccount}</p>
            {data.budget.splitAccounts && (
              <p className="text-sm text-charcoal/70 mt-1">
                (Individual accounts assigned per receipt below)
              </p>
            )}
          </div>
        </div>

        {/* Receipts */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-charcoal/70 uppercase tracking-wide mb-3">
            Receipts ({data.receipts.length})
          </h3>
          <div className="space-y-3">
            {data.receipts.map((receipt, index) => (
              <div className="bg-warm-white p-4 rounded-lg" key={index}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-charcoal">{receipt.description}</p>
                    <p className="text-sm text-charcoal/70">
                      {formatDate(receipt.date)}
                      {receipt.placeOfPurchase && ` • ${receipt.placeOfPurchase}`}
                    </p>
                    <p className="text-xs text-eagle-blue mt-1">
                      Account: {getReceiptBudgetAccount(index)}
                    </p>
                  </div>
                  <p className="font-semibold text-charcoal ml-4">
                    {formatCurrency(receipt.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <div className="text-right">
              <p className="text-sm text-charcoal/70">Total Amount</p>
              <p className="text-2xl font-bold text-eagle-blue">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>

        {/* Files */}
        {data.files.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-charcoal/70 uppercase tracking-wide mb-3">
              Attached Files ({data.files.length})
            </h3>
            <ul className="bg-warm-white rounded-lg divide-y divide-charcoal/10">
              {data.files.map((file) => (
                <li className="p-3 flex items-center space-x-3" key={file.key}>
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5 text-charcoal/70"
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
                  <span className="text-charcoal">{file.filename}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="p-4 bg-eagle-blue/10 border border-eagle-blue/20 rounded-lg">
          <p className="text-sm text-eagle-blue">
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
    </form>
  );
}
