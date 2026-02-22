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

      <div className="sr-only" aria-live="polite" role="status">
        Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
      </div>

      {currentStep === 0 && (
        <RequesterInfo data={state.requester} onChange={updateRequester} onNext={nextStep} />
      )}

      {currentStep === 1 && (
        <ReceiptEntries
          receipts={state.receipts}
          onUpdate={updateReceipt}
          onAdd={addReceipt}
          onRemove={removeReceipt}
          onNext={nextStep}
          onBack={prevStep}
          totalAmount={totalAmount}
        />
      )}

      {currentStep === 2 && (
        <BudgetAccount
          budget={state.budget}
          receipts={state.receipts}
          onUpdateBudget={updateBudget}
          onUpdateReceipt={updateReceipt}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}

      {currentStep === 3 && (
        <FileUploads
          files={state.files}
          onAddFile={addFile}
          onRemoveFile={removeFile}
          onNext={nextStep}
          onBack={prevStep}
          turnstileToken={turnstileToken}
          onResetTurnstile={resetTurnstile}
        />
      )}

      {currentStep === 4 && (
        <ReviewSubmit
          data={state}
          totalAmount={totalAmount}
          onBack={prevStep}
          onSubmit={handleSubmit}
          getReceiptBudgetAccount={getReceiptBudgetAccount}
          turnstileToken={turnstileToken}
          onResetTurnstile={resetTurnstile}
        />
      )}

      <div className="flex justify-center mt-6">
        <div ref={turnstileRef} />
      </div>
    </div>
  );
}
