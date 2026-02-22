import {forwardRef, type SelectHTMLAttributes} from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: {value: string; label: string}[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({className = '', label, error, options, id, required, ...props}, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = error ? `${selectId}-error` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-charcoal/80 mb-1" htmlFor={selectId}>
            {label}
            {required && (
              <span aria-hidden="true" className="text-red-500 ml-1">
                *
              </span>
            )}
          </label>
        )}
        <select
          aria-describedby={errorId}
          aria-invalid={error ? true : undefined}
          className={`w-full px-3 py-2 border rounded-lg shadow-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-eagle-blue focus:border-eagle-blue bg-white ${
            error ? 'border-red-500' : 'border-charcoal/20'
          } ${className}`}
          id={selectId}
          ref={ref}
          {...props}
        >
          <option value="">Select...</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-600" id={errorId} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
