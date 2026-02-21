import { useState, useMemo, useRef, useId, useCallback } from 'react';
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
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const listboxId = `${id}-listbox`;

  const filteredAccounts = useMemo(() => {
    if (!search) return BUDGET_ACCOUNTS;
    const lower = search.toLowerCase();
    return BUDGET_ACCOUNTS.filter((account) =>
      account.toLowerCase().includes(lower)
    );
  }, [search]);

  const handleSelect = useCallback((account: string) => {
    onChange(account);
    setSearch('');
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < filteredAccounts.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : filteredAccounts.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredAccounts.length) {
          handleSelect(filteredAccounts[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  // Scroll active option into view
  const activeOptionId = activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined;
  if (listboxRef.current && activeOptionId) {
    const activeEl = listboxRef.current.querySelector(`#${CSS.escape(activeOptionId)}`);
    activeEl?.scrollIntoView({ block: 'nearest' });
  }

  return (
    <div className="w-full" ref={containerRef}>
      <label htmlFor={`${id}-input`} className="block text-sm font-medium text-charcoal/80 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={`${id}-input`}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-required={required || undefined}
          value={isOpen ? search : value}
          onChange={(e) => {
            setSearch(e.target.value);
            setActiveIndex(-1);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={(e) => {
            // Close only if focus moves outside the container
            if (!containerRef.current?.contains(e.relatedTarget as Node)) {
              setIsOpen(false);
              setActiveIndex(-1);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search or select an account..."
          autoComplete="off"
          className="w-full px-3 py-2 border border-charcoal/20 rounded-lg shadow-sm text-charcoal placeholder:text-charcoal/70 focus:outline-none focus:ring-2 focus:ring-eagle-blue focus:border-eagle-blue"
          required={required}
        />
        {value && !isOpen && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(true);
              inputRef.current?.focus();
            }}
            aria-label="Clear selection"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-charcoal/70 hover:text-charcoal/80"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {isOpen && (
          <ul
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            className="absolute z-10 w-full mt-1 bg-white border border-charcoal/20 rounded-lg shadow-lg max-h-60 overflow-auto"
          >
            {filteredAccounts.length === 0 ? (
              <li className="px-3 py-2 text-charcoal/70" role="option" aria-selected={false}>No accounts found</li>
            ) : (
              filteredAccounts.map((account, index) => (
                <li
                  key={account}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={account === value}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(account);
                  }}
                  className={`px-3 py-2 cursor-pointer text-charcoal hover:bg-eagle-blue/10 ${
                    account === value ? 'bg-eagle-blue/20 font-medium' : ''
                  } ${index === activeIndex ? 'bg-eagle-blue/10 outline outline-2 outline-eagle-blue' : ''}`}
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
        <p className="text-charcoal/70 mb-6">
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
                  key={index}
                  className="p-3 bg-warm-white rounded-lg border border-charcoal/10"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-charcoal">
                      Receipt {index + 1}: {receipt.description || 'No description'}
                    </span>
                    <span className="text-sm text-charcoal/70">
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
