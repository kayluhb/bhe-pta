import {useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';

import {BUDGET_ACCOUNTS} from '~/lib/reimbursement/validation';

export interface SearchableBudgetAccountSelectProps {
  disabled?: boolean;
  hideLabel?: boolean;
  id?: string;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}

export function SearchableBudgetAccountSelect({
  disabled = false,
  hideLabel = false,
  id: idProp,
  label,
  onChange,
  required = false,
  value,
}: SearchableBudgetAccountSelectProps) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [listboxStyle, setListboxStyle] = useState<React.CSSProperties>({});
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const listboxId = `${id}-listbox`;

  const filteredAccounts = useMemo(() => {
    if (!search) return BUDGET_ACCOUNTS;
    const lower = search.toLowerCase();
    return BUDGET_ACCOUNTS.filter((account) => account.toLowerCase().includes(lower));
  }, [search]);

  const updateListboxPosition = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    const rect = input.getBoundingClientRect();
    setListboxStyle({
      left: rect.left,
      maxHeight: Math.min(240, Math.max(120, window.innerHeight - rect.bottom - 8)),
      top: rect.bottom + 4,
      width: rect.width,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || disabled) return;
    updateListboxPosition();
  }, [disabled, isOpen, search, updateListboxPosition]);

  useEffect(() => {
    if (!isOpen || disabled) return;
    const onReposition = () => updateListboxPosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [disabled, isOpen, updateListboxPosition]);

  const handleSelect = useCallback(
    (account: string) => {
      onChange(account);
      setActiveIndex(-1);
      setIsOpen(false);
      setSearch('');
      inputRef.current?.focus();
    },
    [onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(0);
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < filteredAccounts.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredAccounts.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredAccounts.length) {
          handleSelect(filteredAccounts[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setActiveIndex(-1);
        setIsOpen(false);
        break;
    }
  };

  const activeOptionId = activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined;
  if (listboxRef.current && activeOptionId) {
    const activeEl = listboxRef.current.querySelector(`#${CSS.escape(activeOptionId)}`);
    activeEl?.scrollIntoView({block: 'nearest'});
  }

  const listbox =
    isOpen && !disabled
      ? createPortal(
          <div
            className="fixed z-50 bg-white border border-charcoal/20 rounded-lg shadow-lg overflow-auto"
            id={listboxId}
            ref={listboxRef}
            role="listbox"
            style={listboxStyle}
          >
            {filteredAccounts.length === 0 ? (
              <div
                aria-selected={false}
                className="px-3 py-2 text-charcoal/70"
                role="option"
                tabIndex={-1}
              >
                No accounts found
              </div>
            ) : (
              filteredAccounts.map((account, index) => (
                <div
                  aria-selected={account === value}
                  className={`px-3 py-2 cursor-pointer text-charcoal hover:bg-eagle-blue/10 ${
                    account === value ? 'bg-eagle-blue/20 font-medium' : ''
                  } ${index === activeIndex ? 'bg-eagle-blue/10 outline-2 outline-eagle-blue' : ''}`}
                  id={`${id}-option-${index}`}
                  key={account}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(account);
                  }}
                  role="option"
                  tabIndex={index === activeIndex ? 0 : -1}
                >
                  {account}
                </div>
              ))
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="w-full" ref={containerRef}>
      <label
        className={hideLabel ? 'sr-only' : 'block text-sm font-medium text-charcoal/80 mb-1'}
        htmlFor={`${id}-input`}
      >
        {label}
        {required && !hideLabel && (
          <span aria-hidden="true" className="text-red-500 ml-1">
            *
          </span>
        )}
      </label>
      <div className="relative">
        <input
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-required={required || undefined}
          autoComplete="off"
          className="w-full px-3 py-2 border border-charcoal/20 rounded-lg shadow-sm text-charcoal placeholder:text-charcoal/70 focus:outline-none focus:ring-2 focus:ring-eagle-blue focus:border-eagle-blue disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60"
          disabled={disabled}
          id={`${id}-input`}
          onBlur={(e) => {
            const next = e.relatedTarget as Node | null;
            if (
              containerRef.current?.contains(next) ||
              listboxRef.current?.contains(next)
            ) {
              return;
            }
            setActiveIndex(-1);
            setIsOpen(false);
          }}
          onChange={(e) => {
            setActiveIndex(-1);
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search or select an account..."
          ref={inputRef}
          required={required}
          role="combobox"
          type="text"
          value={isOpen ? search : value}
        />
        {value && !isOpen && !disabled && (
          <button
            aria-label="Clear selection"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-charcoal/70 hover:text-charcoal/80"
            onClick={() => {
              onChange('');
              setIsOpen(true);
              inputRef.current?.focus();
            }}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M6 18L18 6M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </button>
        )}
        {listbox}
      </div>
    </div>
  );
}
