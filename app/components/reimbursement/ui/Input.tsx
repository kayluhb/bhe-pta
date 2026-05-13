import {forwardRef, type InputHTMLAttributes} from 'react';
import {blurNumberInputOnWheel} from '~/lib/blur-number-input-on-wheel';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({className = '', label, error, id, onWheel, required, type, ...props}, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-charcoal/80 mb-1" htmlFor={inputId}>
            {label}
            {required && (
              <span aria-hidden="true" className="text-red-500 ml-1">
                *
              </span>
            )}
          </label>
        )}
        <input
          aria-describedby={errorId}
          aria-invalid={error ? true : undefined}
          className={`w-full px-3 py-2 border rounded-lg shadow-sm text-charcoal placeholder:text-charcoal/60 focus:outline-none focus:ring-2 focus:ring-eagle-blue focus:border-eagle-blue disabled:bg-charcoal/5 disabled:text-charcoal/50 ${
            error ? 'border-red-500' : 'border-charcoal/20'
          } ${className}`}
          id={inputId}
          onWheel={(event) => {
            if (type === 'number') {
              blurNumberInputOnWheel(event);
            }
            onWheel?.(event);
          }}
          ref={ref}
          required={required}
          type={type}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600" id={errorId} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
