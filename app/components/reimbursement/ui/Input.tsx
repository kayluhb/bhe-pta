import {forwardRef, type InputHTMLAttributes} from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({className = '', label, error, id, required, ...props}, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-charcoal/80 mb-1">
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={`w-full px-3 py-2 border rounded-lg shadow-sm text-charcoal placeholder:text-charcoal/60 focus:outline-none focus:ring-2 focus:ring-eagle-blue focus:border-eagle-blue disabled:bg-charcoal/5 disabled:text-charcoal/50 ${
            error ? 'border-red-500' : 'border-charcoal/20'
          } ${className}`}
          required={required}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
