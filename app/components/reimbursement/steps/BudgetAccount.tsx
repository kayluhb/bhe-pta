import { useState, useMemo } from 'react';
import { Button } from '~/components/reimbursement/ui/Button';
import { BUDGET_ACCOUNTS, type ReceiptData, type BudgetSelectionData } from '~/lib/reimbursement/validation';

interface BudgetAccountProps {
  budget: BudgetSelectionData;
  receipts: ReceiptData[];
  onUpdateBudget: (data: Partial<BudgetSelectionData>) => void;
  onUpdateReceipt: (index: number, data: Partial<ReceiptData>) => void;
  onNext: () => void;
  onBack: () => void;
}

function SearchableSelect({
  value,
  onChange,
  label,
  required = false,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredAccounts = useMemo(() => {
    if (!search) return BUDGET_ACCOUNTS;
    const lower = search.toLowerCase();
    return BUDGET_ACCOUNTS.filter((account) =>
      account.toLowerCase().includes(lower)
    );
  }, [search]);

  const handleSelect = (account: string) => {
    onChange(account);
    setSearch('');
    setIsOpen(false);
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-charcoal/80 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={isOpen ? search : value}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            // Delay to allow click on option
            setTimeout(() => setIsOpen(false), 200);
          }}
          placeholder="Search or select an account..."
          className="w-full px-3 py-2 border border-charcoal/20 rounded-lg shadow-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-eagle-blue focus:border-eagle-blue"
          required={required}
        />
        {value && !isOpen && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(true);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal/60"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {isOpen && (
          <ul className="absolute z-10 w-full mt-1 bg-white border border-charcoal/20 rounded-lg shadow-lg max-h-60 overflow-auto">
            {filteredAccounts.length === 0 ? (
              <li className="px-3 py-2 text-charcoal/50">No accounts found</li>
            ) : (
              filteredAccounts.map((account) => (
                <li
                  key={account}
                  onClick={() => handleSelect(account)}
                  className={`px-3 py-2 cursor-pointer text-charcoal hover:bg-eagle-blue/10 ${
                    account === value ? 'bg-eagle-blue/20 font-medium' : ''
                  }`}
                >
                  {account}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-charcoal/10">
        <h2 className="text-xl font-semibold text-charcoal mb-2">Budget Account</h2>
        <p className="text-charcoal/60 mb-6">
          Select which PTA budget account should be debited for this reimbursement.
        </p>

        <div className="space-y-6">
          <SearchableSelect
            label="Budget Account to Debit"
            value={budget.primaryAccount}
            onChange={(value) => onUpdateBudget({ primaryAccount: value })}
            required
          />

          {receipts.length > 1 && (
            <div className="border-t pt-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={budget.splitAccounts}
                  onChange={(e) => onUpdateBudget({ splitAccounts: e.target.checked })}
                  className="w-4 h-4 text-eagle-blue border-charcoal/20 rounded focus:ring-eagle-blue"
                />
                <span className="text-sm font-medium text-charcoal/80">
                  Split receipts across different accounts
                </span>
              </label>
              <p className="mt-1 ml-7 text-xs text-charcoal/50">
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
                  key={index}
                  className="p-3 bg-warm-white rounded-lg border border-charcoal/10"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-charcoal">
                      Receipt {index + 1}: {receipt.description || 'No description'}
                    </span>
                    <span className="text-sm text-charcoal/60">
                      {formatCurrency(receipt.amount)}
                    </span>
                  </div>
                  <SearchableSelect
                    label=""
                    value={receipt.budgetAccount || budget.primaryAccount}
                    onChange={(value) => onUpdateReceipt(index, { budgetAccount: value })}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={!budget.primaryAccount}>
          Next: Upload Files
        </Button>
      </div>
    </form>
  );
}
