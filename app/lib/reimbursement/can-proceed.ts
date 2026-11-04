import type {FormState} from '~/hooks/useFormState';

/** Client-side gate for reimbursement wizard Next buttons. */
export function canProceedToNext(
  step: number,
  state: FormState,
  salesTaxConfirmed: boolean,
): boolean {
  if (step === 0) {
    const r = state.requester;
    return Boolean(
      r.payableTo.trim() &&
        r.email.trim() &&
        r.address.trim() &&
        r.dateCheckNeeded.trim(),
    );
  }

  if (step === 1) {
    if (!salesTaxConfirmed) return false;
    if (state.receipts.length === 0) return false;
    return state.receipts.every(
      (receipt) =>
        receipt.date.trim() &&
        receipt.description.trim() &&
        Number(receipt.amount) > 0,
    );
  }

  if (step === 2) {
    return Boolean(state.budget.primaryAccount.trim());
  }

  return true;
}
