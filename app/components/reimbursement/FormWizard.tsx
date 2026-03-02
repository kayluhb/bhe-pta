import {useNavigate} from 'react-router';
import {useFormState} from '~/hooks/useFormState';
import {useTurnstile} from '~/hooks/useTurnstile';
import {FormProgress} from './FormProgress';
import {BudgetAccount} from './steps/BudgetAccount';
import {FileUploads} from './steps/FileUploads';
import {ReceiptEntries} from './steps/ReceiptEntries';
import {RequesterInfo} from './steps/RequesterInfo';
import {ReviewSubmit} from './steps/ReviewSubmit';

const STEPS = ['Request Info', 'Receipts', 'Budget', 'Files', 'Review'];

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
    addFile,
    removeFile,
    updateBudget,
    nextStep,
    prevStep,
    getReceiptBudgetAccount,
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
        files: state.files,
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

  return (
    <div className="max-w-2xl mx-auto">
      <FormProgress currentStep={currentStep} steps={STEPS} />

      <div aria-live="polite" className="sr-only" role="status">
        Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
      </div>

      {currentStep === 0 && (
        <>
          <div className="max-w-2xl mx-auto mb-10 rounded-lg border border-charcoal/10 bg-white p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold text-charcoal">
              Check Request / Reimbursement
            </h2>
            <p className="mt-3 text-charcoal/80">
              Use this form to request reimbursement for PTA-related purchases. Submit everything
              online—no need to print or drop anything off. You’ll get a confirmation email after
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
                Upload a receipt (photo or scan) for each item. A receipt is required for every
                line.
              </li>
            </ul>
          </div>
          <RequesterInfo data={state.requester} onChange={updateRequester} onNext={nextStep} />
        </>
      )}

      {currentStep === 1 && (
        <ReceiptEntries
          onAdd={addReceipt}
          onBack={prevStep}
          onNext={nextStep}
          onRemove={removeReceipt}
          onUpdate={updateReceipt}
          receipts={state.receipts}
          totalAmount={totalAmount}
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
        />
      )}

      {currentStep === 3 && (
        <FileUploads
          files={state.files}
          onAddFile={addFile}
          onBack={prevStep}
          onNext={nextStep}
          onRemoveFile={removeFile}
          onResetTurnstile={resetTurnstile}
          payableTo={state.requester.payableTo}
          turnstileToken={turnstileToken}
        />
      )}

      {currentStep === 4 && (
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
        <div aria-label="Security verification" ref={turnstileRef} />
      </div>
    </div>
  );
}
