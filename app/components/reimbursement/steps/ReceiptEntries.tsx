import {Button} from '~/components/reimbursement/ui/Button';
import {Input} from '~/components/reimbursement/ui/Input';
import type {ReceiptData} from '~/lib/reimbursement/validation';

interface ReceiptEntriesProps {
  receipts: ReceiptData[];
  onUpdate: (index: number, data: Partial<ReceiptData>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onNext: () => void;
  onBack: () => void;
  totalAmount: number;
}

export function ReceiptEntries({
  receipts,
  onUpdate,
  onAdd,
  onRemove,
  onNext,
  onBack,
  totalAmount,
}: ReceiptEntriesProps) {
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-charcoal/10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-charcoal">Receipt Details</h2>
            <p className="text-charcoal/70 mt-1">Add up to 4 receipts for reimbursement.</p>
          </div>
          <div className="text-right" aria-live="polite">
            <p className="text-sm text-charcoal/70">Total</p>
            <p className="text-2xl font-bold text-eagle-blue">{formatCurrency(totalAmount)}</p>
          </div>
        </div>

        <div className="space-y-6">
          {receipts.map((receipt, index) => (
            <div key={index} className="p-4 bg-warm-white rounded-lg border border-charcoal/10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-charcoal">Receipt {index + 1}</h3>
                {receipts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    aria-label={`Remove Receipt ${index + 1}`}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Date of Purchase"
                  type="date"
                  value={receipt.date}
                  onChange={(e) => onUpdate(index, {date: e.target.value})}
                  required
                />

                <div className="w-full">
                  <Input
                    label="Amount to Reimburse"
                    type="number"
                    step="0.01"
                    min="0"
                    value={receipt.amount || ''}
                    onChange={(e) =>
                      onUpdate(index, {amount: Number.parseFloat(e.target.value) || 0})
                    }
                    placeholder="0.00"
                    required
                  />
                  <p className="mt-1 text-xs text-charcoal/70">
                    Note: Sales tax cannot be reimbursed and should not be included.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <Input
                    label="Description"
                    value={receipt.description}
                    onChange={(e) => onUpdate(index, {description: e.target.value})}
                    placeholder="What was purchased?"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Input
                    label="Place of Purchase"
                    value={receipt.placeOfPurchase || ''}
                    onChange={(e) => onUpdate(index, {placeOfPurchase: e.target.value})}
                    placeholder="Name of store or location of website"
                  />
                  <p className="mt-1 text-xs text-charcoal/70">
                    Name of store or location of website.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {receipts.length < 4 && (
          <button
            type="button"
            onClick={onAdd}
            className="mt-4 w-full py-3 border-2 border-dashed border-charcoal/20 rounded-lg text-charcoal/70 hover:border-eagle-blue hover:text-eagle-blue transition-colors"
          >
            + Add Another Receipt
          </button>
        )}
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">Next: Budget Account</Button>
      </div>
    </form>
  );
}
