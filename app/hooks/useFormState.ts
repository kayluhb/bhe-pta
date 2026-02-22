import {useCallback, useEffect, useState} from 'react';
import type {
  BudgetSelectionData,
  FileData,
  ReceiptData,
  RequesterData,
} from '~/lib/reimbursement/validation';

const STORAGE_KEY = 'bhe-pta-requester-info';

type SavedRequesterInfo = Pick<RequesterData, 'payableTo' | 'email' | 'phone' | 'address'>;

function loadSavedRequesterInfo(): SavedRequesterInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as SavedRequesterInfo;
  } catch {
    return null;
  }
}

function saveRequesterInfo(data: RequesterData) {
  if (typeof window === 'undefined') return;
  try {
    const toSave: SavedRequesterInfo = {
      payableTo: data.payableTo,
      email: data.email,
      phone: data.phone || '',
      address: data.address,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Silently ignore storage errors
  }
}

export interface FormState {
  requester: RequesterData;
  receipts: ReceiptData[];
  files: FileData[];
  budget: BudgetSelectionData;
}

const getTodayDate = () => new Date().toISOString().split('T')[0];

const getTwoWeeksFromToday = () => {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().split('T')[0];
};

const initialState: FormState = {
  requester: {
    payableTo: '',
    email: '',
    phone: '',
    address: '',
    dateOfRequest: getTodayDate(),
    dateCheckNeeded: getTwoWeeksFromToday(),
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
  const [state, setState] = useState<FormState>(() => {
    const saved = loadSavedRequesterInfo();
    if (saved) {
      return {
        ...initialState,
        requester: {
          ...initialState.requester,
          ...saved,
          dateOfRequest: getTodayDate(),
        },
      };
    }
    return initialState;
  });
  const [currentStep, setCurrentStep] = useState(0);

  // Persist requester info to localStorage when it changes
  useEffect(() => {
    const {payableTo, email, address} = state.requester;
    if (payableTo || email || address) {
      saveRequesterInfo(state.requester);
    }
  }, [state.requester]);

  const updateRequester = useCallback((data: Partial<RequesterData>) => {
    setState((prev) => ({
      ...prev,
      requester: {...prev.requester, ...data},
    }));
  }, []);

  const updateReceipt = useCallback((index: number, data: Partial<ReceiptData>) => {
    setState((prev) => {
      const newReceipts = [...prev.receipts];
      newReceipts[index] = {...newReceipts[index], ...data};
      return {...prev, receipts: newReceipts};
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
      if (prev.files.length >= 8) return prev;
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
      budget: {...prev.budget, ...data},
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
    const saved = loadSavedRequesterInfo();
    setState({
      ...initialState,
      requester: {
        ...initialState.requester,
        ...(saved || {}),
        dateOfRequest: getTodayDate(),
      },
    });
    setCurrentStep(0);
  }, []);

  const totalAmount = state.receipts.reduce((sum, r) => sum + (r.amount || 0), 0);

  // Get effective budget account for each receipt
  const getReceiptBudgetAccount = useCallback(
    (index: number): string => {
      if (state.budget.splitAccounts && state.receipts[index]?.budgetAccount) {
        return state.receipts[index].budgetAccount!;
      }
      return state.budget.primaryAccount;
    },
    [state.budget.splitAccounts, state.budget.primaryAccount, state.receipts],
  );

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
