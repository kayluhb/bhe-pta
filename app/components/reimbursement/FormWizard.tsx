import {useCallback, useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router';
import {useFormState} from '~/hooks/useFormState';
import {useTurnstile} from '~/hooks/useTurnstile';
import {FormProgress} from './FormProgress';
import {BudgetAccount} from './steps/BudgetAccount';
import {ReceiptEntries} from './steps/ReceiptEntries';
import {RequesterInfo} from './steps/RequesterInfo';
import {ReviewSubmit} from './steps/ReviewSubmit';

const STEPS = ['Request Info', 'Receipts', 'Budget', 'Review'];
const HELP_SEEN_KEY = 'bhe-reimbursement-info-seen';

export function FormWizard() {
  const navigate = useNavigate();
  const {
    state,
    currentStep,
    totalAmount,
    updateRequester,
    updateReceipt,
    addReceipt,
    removeReceipt,
    appendReceiptFiles,
    removeFileFromReceipt,
    flattenFilesForSubmit,
    flattenReceiptUploadsForSubmit,
    updateBudget,
    nextStep,
    prevStep,
    getReceiptBudgetAccount,
    fileError,
  } = useFormState();

  const {token: turnstileToken, containerRef: turnstileRef, reset: resetTurnstile} = useTurnstile();

  const handleSubmit = async (turnstileToken: string) => {
    const response = await fetch('/api/reimbursement/submit', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        requester: state.requester,
        receipts: state.receipts.map((r, i) => ({
          ...r,
          budgetAccount: getReceiptBudgetAccount(i),
        })),
        files: flattenFilesForSubmit(),
        receiptUploads: flattenReceiptUploadsForSubmit(),
        budget: state.budget,
        turnstileToken,
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as {error?: string};
      throw new Error(errorData.error || 'Submission failed');
    }

    const result = (await response.json()) as {submissionId: string};
    navigate(`/reimbursement/success?id=${result.submissionId}`);
  };

  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [showHelp, setShowHelp] = useState(false);

  const closeHelp = useCallback(() => {
    setShowHelp(false);
    try {
      localStorage.setItem(HELP_SEEN_KEY, '1');
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (!localStorage.getItem(HELP_SEEN_KEY)) {
        setShowHelp(true);
      }
    } catch {
      setShowHelp(true);
    }
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (showHelp) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [showHelp]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (event: Event) => {
      event.preventDefault();
      closeHelp();
    };
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [closeHelp]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Help dialog */}
      <dialog
        aria-describedby="help-dialog-desc"
        aria-labelledby="help-dialog-title"
        className="max-w-lg w-full m-auto rounded-lg border border-charcoal/10 bg-white p-0 shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeHelp();
        }}
        onKeyDown={(e) => {
          if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === 'Escape')) {
            closeHelp();
          }
        }}
        ref={dialogRef}
      >
        <div className="p-6" role="document">
          <div className="flex items-start justify-between">
            <h2 className="font-heading text-lg font-semibold text-charcoal" id="help-dialog-title">
              Check Request / Reimbursement
            </h2>
            <button
              aria-label="Close dialog"
              className="ml-4 shrink-0 rounded-full p-1 text-charcoal/50 hover:bg-charcoal/5 hover:text-charcoal transition-colors"
              onClick={closeHelp}
              ref={closeButtonRef}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div id="help-dialog-desc">
            <p className="mt-3 text-charcoal/80">
              Use this form to request reimbursement for PTA-related purchases. Submit everything
              online—no need to print or drop anything off. You'll get a confirmation email after
              submitting.
            </p>
            <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-charcoal/80">
              <li>
                <strong>Sales tax is not reimbursed</strong>—do not include it in your amounts.
              </li>
              <li>
                You may include up to four items per request. Submit another request for more.
              </li>
              <li>
                On the Receipts step, use the upload under each line to attach a photo or scan
                (optional per line). Each upload is added to the list for that line.
              </li>
            </ul>
          </div>
          <button
            className="mt-6 w-full rounded-lg bg-eagle-blue px-4 py-2.5 font-heading font-semibold text-white hover:bg-eagle-blue/90 transition-colors"
            onClick={closeHelp}
            type="button"
          >
            Got it
          </button>
        </div>
      </dialog>

      <FormProgress currentStep={currentStep} steps={STEPS} />

      <div aria-live="polite" className="sr-only" role="status">
        Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
      </div>

      {currentStep === 0 && (
        <RequesterInfo
          data={state.requester}
          onChange={updateRequester}
          onNext={nextStep}
          onShowHelp={() => setShowHelp(true)}
        />
      )}

      {currentStep === 1 && (
        <ReceiptEntries
          fileError={fileError}
          filesByReceipt={state.filesByReceipt}
          onAdd={addReceipt}
          onAppendReceiptFiles={appendReceiptFiles}
          onBack={prevStep}
          onNext={nextStep}
          onRemove={removeReceipt}
          onRemoveFileFromReceipt={removeFileFromReceipt}
          onResetTurnstile={resetTurnstile}
          onUpdate={updateReceipt}
          payableTo={state.requester.payableTo}
          receipts={state.receipts}
          totalAmount={totalAmount}
          turnstileToken={turnstileToken}
        />
      )}

      {currentStep === 2 && (
        <BudgetAccount
          budget={state.budget}
          onBack={prevStep}
          onNext={nextStep}
          onUpdateBudget={updateBudget}
          onUpdateReceipt={updateReceipt}
          receipts={state.receipts}
          turnstileToken={turnstileToken}
        />
      )}

      {currentStep === 3 && (
        <ReviewSubmit
          data={state}
          getReceiptBudgetAccount={getReceiptBudgetAccount}
          onBack={prevStep}
          onResetTurnstile={resetTurnstile}
          onSubmit={handleSubmit}
          totalAmount={totalAmount}
          turnstileToken={turnstileToken}
        />
      )}

      <div className="flex justify-center mt-6">
        <div ref={turnstileRef} />
      </div>
    </div>
  );
}
