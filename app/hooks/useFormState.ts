import { useState, useCallback } from 'react';
import type { RequesterData, ReceiptData, FileData, BudgetSelectionData } from '~/lib/reimbursement/validation';

export interface FormState {
  requester: RequesterData;
  receipts: ReceiptData[];
  files: FileData[];
  budget: BudgetSelectionData;
}

const getTodayDate = () => new Date().toISOString().split('T')[0];

const initialState: FormState = {
  requester: {
    payableTo: '',
    email: '',
    phone: '',
    address: '',
    dateOfRequest: getTodayDate(),
    dateCheckNeeded: '',
    invoiceNumber: '',
  },
  receipts: [
    {
      date: '',
      description: '',
      amount: 0,
      placeOfPurchase: '',
      budgetAccount: '',
    },
  ],
  files: [],
  budget: {
    primaryAccount: '',
    splitAccounts: false,
  },
};

const TOTAL_STEPS = 5; // Info, Receipts, Budget, Files, Review

export function useFormState() {
  const [state, setState] = useState<FormState>(initialState);
  const [currentStep, setCurrentStep] = useState(0);

  const updateRequester = useCallback((data: Partial<RequesterData>) => {
    setState((prev) => ({
      ...prev,
      requester: { ...prev.requester, ...data },
    }));
  }, []);

  const updateReceipt = useCallback((index: number, data: Partial<ReceiptData>) => {
    setState((prev) => {
      const newReceipts = [...prev.receipts];
      newReceipts[index] = { ...newReceipts[index], ...data };
      return { ...prev, receipts: newReceipts };
    });
  }, []);

  const addReceipt = useCallback(() => {
    setState((prev) => {
      if (prev.receipts.length >= 4) return prev;
      return {
        ...prev,
        receipts: [
          ...prev.receipts,
          {
            date: '',
            description: '',
            amount: 0,
            placeOfPurchase: '',
            budgetAccount: '',
          },
        ],
      };
    });
  }, []);

  const removeReceipt = useCallback((index: number) => {
    setState((prev) => {
      if (prev.receipts.length <= 1) return prev;
      return {
        ...prev,
        receipts: prev.receipts.filter((_, i) => i !== index),
      };
    });
  }, []);

  const addFile = useCallback((file: FileData) => {
    setState((prev) => {
      if (prev.files.length >= 4) return prev;
      return {
        ...prev,
        files: [...prev.files, file],
      };
    });
  }, []);

  const removeFile = useCallback((key: string) => {
    setState((prev) => ({
      ...prev,
      files: prev.files.filter((f) => f.key !== key),
    }));
  }, []);

  const updateBudget = useCallback((data: Partial<BudgetSelectionData>) => {
    setState((prev) => ({
      ...prev,
      budget: { ...prev.budget, ...data },
    }));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, TOTAL_STEPS - 1)));
  }, []);

  const reset = useCallback(() => {
    setState({
      ...initialState,
      requester: {
        ...initialState.requester,
        dateOfRequest: getTodayDate(),
      },
    });
    setCurrentStep(0);
  }, []);

  const totalAmount = state.receipts.reduce((sum, r) => sum + (r.amount || 0), 0);

  // Get effective budget account for each receipt
  const getReceiptBudgetAccount = useCallback((index: number): string => {
    if (state.budget.splitAccounts && state.receipts[index]?.budgetAccount) {
      return state.receipts[index].budgetAccount!;
    }
    return state.budget.primaryAccount;
  }, [state.budget.splitAccounts, state.budget.primaryAccount, state.receipts]);

  return {
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
    goToStep,
    reset,
    getReceiptBudgetAccount,
  };
}
