import {useCallback, useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router';
import {useFormState} from '~/hooks/useFormState';
import {useTurnstile} from '~/hooks/useTurnstile';
import {FormProgress} from './FormProgress';
import {BudgetAccount} from './steps/BudgetAccount';
import {ReceiptEntries} from './steps/ReceiptEntries';
import {RequesterInfo} from './steps/RequesterInfo';
import {ReviewSubmit} from './steps/ReviewSubmit';

const STEPS = ['Request info', 'Receipts', 'Budget', 'Review'];
const PHONE_STEPS = ['Info', 'Receipts', 'Budget', 'Review'];
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
    goToStep,
    getReceiptBudgetAccount,
    fileError,
  } = useFormState();

  const {token: turnstileToken, containerRef: turnstileRef, reset: resetTurnstile} = useTurnstile();

  const handleSubmit = async (turnstileToken: string) => {
    const response = await fetch('/api/reimbursement/submit', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        budget: state.budget,
        files: flattenFilesForSubmit(),
        receiptUploads: flattenReceiptUploadsForSubmit(),
        receipts: state.receipts.map((r, i) => ({
          ...r,
          budgetAccount: getReceiptBudgetAccount(i),
        })),
        reimbursementDraftId: state.reimbursementDraftId,
        requester: state.requester,
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
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <dialog
        aria-describedby="help-dialog-desc"
        aria-labelledby="help-dialog-title"
        className="m-auto w-full max-w-lg rounded-panel border border-bhe-border bg-bhe-card p-0 shadow-form backdrop:bg-black/40 backdrop:backdrop-blur-sm"
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
            <h2
              className="font-display text-lg font-bold text-bhe-ink"
              id="help-dialog-title"
            >
              Reimbursement help
            </h2>
            <button
              aria-label="Close dialog"
              className="ml-4 shrink-0 rounded-full p-1 text-bhe-muted hover:bg-bhe-paper-2 hover:text-bhe-ink"
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
            <p className="mt-3 text-bhe-body">
              Use this form to request reimbursement for PTA-related purchases. Submit everything
              online—no need to print or drop anything off. You&apos;ll get a confirmation email after
              submitting.
            </p>
            <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-bhe-muted">
              <li>
                <strong>Sales tax is not reimbursed</strong>—do not include it in your amounts.
              </li>
              <li>Attach photos or PDFs of receipts (up to 10 files).</li>
              <li>Only PTA-approved expenses qualify.</li>
            </ul>
          </div>
          <button
            className="mt-6 w-full rounded-full bg-bhe-green px-4 py-2.5 font-bold text-bhe-on-green hover:bg-bhe-green-2"
            onClick={closeHelp}
            type="button"
          >
            Got it
          </button>
        </div>
      </dialog>

      <div className="min-w-0 flex-[999_1_560px]">
        {currentStep === 1 ? (
          <div className="mb-4 flex items-center justify-between rounded-card bg-bhe-green px-4 py-3 text-bhe-on-green md:hidden">
            <span className="text-sm font-bold">
              {state.receipts.length} receipt{state.receipts.length === 1 ? '' : 's'} · step 2 of 4
            </span>
            <span className="font-display text-2xl font-extrabold">
              ${totalAmount.toFixed(2)}
            </span>
          </div>
        ) : null}

        <FormProgress
          currentStep={currentStep}
          onStepSelect={goToStep}
          phoneSteps={PHONE_STEPS}
          steps={STEPS}
        />

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
            reimbursementDraftId={state.reimbursementDraftId}
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

        <div className="mt-6 flex justify-center">
          <div ref={turnstileRef} />
        </div>
      </div>

      <aside className="hidden w-full flex-[1_1_300px] flex-col gap-5 lg:flex lg:max-w-sm">
        <div className="rounded-panel bg-bhe-green p-6 text-bhe-on-green">
          <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-bhe-gold">
            Your request
          </p>
          <p className="mt-2 font-display text-4xl font-extrabold">${totalAmount.toFixed(2)}</p>
          <p className="mt-2 text-sm text-bhe-on-green-muted">
            {state.receipts.length} receipt{state.receipts.length === 1 ? '' : 's'} · step{' '}
            {currentStep + 1} of 4
          </p>
        </div>
        <div className="rounded-card border border-bhe-border bg-bhe-card p-6">
          <h2 className="font-display text-lg font-bold text-bhe-ink">Before you start</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-bhe-muted">
            <li>Photos or PDFs of receipts (up to 10 files)</li>
            <li>Amounts before sales tax, which can&apos;t be reimbursed</li>
            <li>The PTA budget account</li>
            <li>Only PTA-approved expenses qualify</li>
          </ul>
          <p className="mt-4 text-sm text-bhe-muted">
            Questions?{' '}
            <a className="font-bold text-bhe-green hover:underline" href="mailto:pta@bheeagles.com">
              Email pta@bheeagles.com
            </a>
          </p>
        </div>
      </aside>
    </div>
  );
}
