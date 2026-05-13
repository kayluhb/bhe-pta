import {useState} from 'react';
import {SearchableBudgetAccountSelect} from '~/components/reimbursement/SearchableBudgetAccountSelect';
import {Button} from '~/components/reimbursement/ui/Button';
import type {BudgetSelectionData, ReceiptData} from '~/lib/reimbursement/validation';

interface BudgetAccountProps {
  budget: BudgetSelectionData;
  receipts: ReceiptData[];
  onUpdateBudget: (data: Partial<BudgetSelectionData>) => void;
  onUpdateReceipt: (index: number, data: Partial<ReceiptData>) => void;
  onNext: () => void;
  onBack: () => void;
  turnstileToken: string | null;
}

function SuggestHelper({
  onSuggest,
  turnstileToken,
}: {
  onSuggest: (account: string) => void;
  turnstileToken: string | null;
}) {
  const [description, setDescription] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [suggested, setSuggested] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleSuggest = async () => {
    if (!description.trim()) return;
    setSuggesting(true);
    setSuggested(null);
    try {
      const response = await fetch('/api/reimbursement/suggest-budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(turnstileToken ? {'X-Turnstile-Token': turnstileToken} : {}),
        },
        body: JSON.stringify({
          receipts: [{description: description.trim(), amount: 0}],
        }),
      });
      if (response.ok) {
        const data = (await response.json()) as {
          suggestions: ({account: string; confidence: string} | null)[];
        };
        const result = data.suggestions?.[0];
        if (result) {
          setSuggested(result.account);
          onSuggest(result.account);
        }
      }
    } finally {
      setSuggesting(false);
    }
  };

  if (!expanded) {
    return (
      <button
        className="mt-3 text-sm text-eagle-blue hover:text-eagle-blue/80 underline underline-offset-2"
        onClick={() => setExpanded(true)}
        type="button"
      >
        Not sure which account to choose? Describe your purchase
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-charcoal/10 bg-warm-white p-4">
      <p className="text-sm font-medium text-charcoal/80 mb-2">
        Describe what you purchased and we'll suggest an account
      </p>
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 border border-charcoal/20 rounded-lg text-sm text-charcoal placeholder:text-charcoal/70 focus:outline-none focus:ring-2 focus:ring-eagle-blue focus:border-eagle-blue"
          disabled={suggesting}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSuggest();
            }
          }}
          placeholder="e.g., Supplies for the spring fling"
          type="text"
          value={description}
        />
        <Button
          disabled={!description.trim() || suggesting || !turnstileToken}
          onClick={handleSuggest}
          title={!turnstileToken ? 'Complete the verification below first' : undefined}
          type="button"
          variant="outline"
        >
          {suggesting ? 'Suggesting...' : 'Suggest'}
        </Button>
      </div>
      {suggested && (
        <p className="mt-2 text-sm text-creek-green">
          Suggested: <strong>{suggested}</strong>
        </p>
      )}
    </div>
  );
}

export function BudgetAccount({
  budget,
  receipts,
  onUpdateBudget,
  onUpdateReceipt,
  onNext,
  onBack,
  turnstileToken,
}: BudgetAccountProps) {
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
        <h2 className="text-xl font-semibold text-charcoal mb-2">Budget Account</h2>
        <p className="text-charcoal/70 mb-6">
          Select which PTA budget account should be debited for this reimbursement.
        </p>

        <div className="space-y-6">
          <div>
            <SearchableBudgetAccountSelect
              label="Budget Account to Debit"
              onChange={(value) => onUpdateBudget({primaryAccount: value})}
              required
              value={budget.primaryAccount}
            />
            <SuggestHelper
              onSuggest={(account) => onUpdateBudget({primaryAccount: account})}
              turnstileToken={turnstileToken}
            />
          </div>

          {receipts.length > 1 && (
            <div className="border-t pt-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  checked={budget.splitAccounts}
                  className="w-4 h-4 text-eagle-blue border-charcoal/20 rounded focus:ring-eagle-blue"
                  onChange={(e) => onUpdateBudget({splitAccounts: e.target.checked})}
                  type="checkbox"
                />
                <span className="text-sm font-medium text-charcoal/80">
                  Split receipts across different accounts
                </span>
              </label>
              <p className="mt-1 ml-7 text-xs text-charcoal/70">
                Enable this to assign different budget accounts to each receipt.
              </p>
            </div>
          )}

          {budget.splitAccounts && receipts.length > 1 && (
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-medium text-charcoal/80">
                Assign accounts to each receipt:
              </h3>
              {receipts.map((receipt, index) => (
                <div
                  className="p-3 bg-warm-white rounded-lg border border-charcoal/10"
                  key={
                    receipt.clientKey ?? `${receipt.date}-${receipt.amount}-${receipt.description}`
                  }
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-charcoal">
                      Receipt {index + 1}: {receipt.description || 'No description'}
                    </span>
                    <span className="text-sm text-charcoal/70">
                      {formatCurrency(receipt.amount)}
                    </span>
                  </div>
                  <SearchableBudgetAccountSelect
                    label="Budget account"
                    onChange={(value) => onUpdateReceipt(index, {budgetAccount: value})}
                    value={receipt.budgetAccount || budget.primaryAccount}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button onClick={onBack} type="button" variant="outline">
          Back
        </Button>
        <Button disabled={!budget.primaryAccount} type="submit">
          Next: Review
        </Button>
      </div>
    </form>
  );
}
