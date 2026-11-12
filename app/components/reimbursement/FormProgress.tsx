interface FormProgressProps {
  currentStep: number;
  onStepSelect?: (step: number) => void;
  steps: string[];
  phoneSteps?: string[];
}

export function FormProgress({currentStep, onStepSelect, phoneSteps, steps}: FormProgressProps) {
  const labels = phoneSteps ?? steps;

  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const done = index < currentStep;
          const current = index === currentStep;
          const clickable = done && onStepSelect;
          return (
            <li
              aria-current={current ? 'step' : undefined}
              className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
              key={step}
            >
              <div className="flex flex-col items-center">
                <button
                  aria-label={`${done ? 'Completed' : current ? 'Current' : 'Upcoming'}: ${labels[index] ?? step}`}
                  className={[
                    'flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors md:h-12 md:w-12',
                    done
                      ? 'border-bhe-green bg-bhe-green text-bhe-on-green'
                      : current
                        ? 'border-bhe-green bg-bhe-paper text-bhe-green'
                        : 'border-bhe-border-input bg-bhe-paper text-bhe-muted',
                    clickable ? 'cursor-pointer' : 'cursor-default',
                  ].join(' ')}
                  disabled={!clickable}
                  onClick={() => clickable && onStepSelect?.(index)}
                  type="button"
                >
                  {done ? (
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        clipRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        fillRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span aria-hidden="true">{index + 1}</span>
                  )}
                </button>
                <span
                  className={`mt-2 text-center text-xs font-bold ${
                    current ? 'text-bhe-ink' : done ? 'text-bhe-green' : 'text-bhe-muted'
                  }`}
                >
                  <span className="sr-only">
                    {done ? 'Completed: ' : current ? 'Current: ' : 'Upcoming: '}
                  </span>
                  <span className="hidden sm:inline">{step}</span>
                  <span className="sm:hidden">{labels[index] ?? step}</span>
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className={`mx-2 mt-5 hidden h-0.5 flex-1 sm:block ${
                    done ? 'bg-bhe-green' : 'bg-bhe-border-input'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
