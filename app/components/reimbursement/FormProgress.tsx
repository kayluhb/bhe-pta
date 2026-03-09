interface FormProgressProps {
  currentStep: number;
  steps: string[];
}

export function FormProgress({currentStep, steps}: FormProgressProps) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center">
        {steps.map((step, index) => (
          <li
            aria-current={index === currentStep ? 'step' : undefined}
            className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
            key={step}
          >
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  index < currentStep
                    ? 'bg-eagle-blue border-eagle-blue text-white'
                    : index === currentStep
                      ? 'border-eagle-blue text-eagle-blue'
                      : 'border-charcoal/20 text-charcoal/70'
                }`}
              >
                {index < currentStep ? (
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5"
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
                  <span aria-hidden="true" className="text-sm font-medium">
                    {index + 1}
                  </span>
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium whitespace-nowrap ${
                  index <= currentStep ? 'text-eagle-blue' : 'text-charcoal/70'
                }`}
              >
                <span className="sr-only">
                  {index < currentStep
                    ? 'Completed: '
                    : index === currentStep
                      ? 'Current: '
                      : 'Upcoming: '}
                </span>
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                aria-hidden="true"
                className={`hidden sm:block flex-1 h-0.5 mx-2 ${
                  index < currentStep ? 'bg-eagle-blue' : 'bg-charcoal/20'
                }`}
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
