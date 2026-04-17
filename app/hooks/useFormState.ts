import {useCallback, useEffect, useState} from 'react';
import {
  MAX_RECEIPT_FILE_RECORDS,
  type BudgetSelectionData,
  type FileData,
  type ReceiptData,
  type RequesterData,
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
  /** One array per receipt row; each entry holds converted + optional original from one upload. */
  filesByReceipt: FileData[][];
  budget: BudgetSelectionData;
}

const getTodayDate = () => new Date().toISOString().split('T')[0];

const getTwoWeeksFromToday = () => {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().split('T')[0];
};

function newReceiptRow(): ReceiptData {
  return {
    clientKey: crypto.randomUUID(),
    date: getTodayDate(),
    description: '',
    amount: 0,
    placeOfPurchase: '',
    budgetAccount: '',
  };
}

/** Must not call `crypto.randomUUID()` at module scope (Cloudflare Workers disallow I/O in global scope). */
function buildDefaultFormState(): FormState {
  return {
    requester: {
      payableTo: '',
      email: '',
      phone: '',
      address: '',
      dateOfRequest: getTodayDate(),
      dateCheckNeeded: getTwoWeeksFromToday(),
      invoiceNumber: '',
    },
    receipts: [newReceiptRow()],
    filesByReceipt: [[]],
    budget: {
      primaryAccount: '',
      splitAccounts: false,
    },
  };
}

const TOTAL_STEPS = 4; // Info, Receipts, Budget, Review

function reindexFilesByReceipt(rows: FileData[][]): FileData[][] {
  return rows.map((files, i) =>
    files.map((f) => ({...f, receiptLineIndex: i + 1})),
  );
}

export function useFormState() {
  const [state, setState] = useState<FormState>(() => {
    const saved = loadSavedRequesterInfo();
    const base = buildDefaultFormState();
    if (saved) {
      return {
        ...base,
        requester: {
          ...base.requester,
          ...saved,
          dateOfRequest: getTodayDate(),
        },
      };
    }
    return base;
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);

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
      const lastReceipt = prev.receipts[prev.receipts.length - 1];
      return {
        ...prev,
        receipts: [
          ...prev.receipts,
          {
            clientKey: crypto.randomUUID(),
            date: lastReceipt?.date || getTodayDate(),
            description: '',
            amount: 0,
            placeOfPurchase: '',
            budgetAccount: '',
          },
        ],
        filesByReceipt: [...prev.filesByReceipt, []],
      };
    });
  }, []);

  const removeReceipt = useCallback((index: number) => {
    setState((prev) => {
      if (prev.receipts.length <= 1) return prev;
      const newReceipts = prev.receipts.filter((_, i) => i !== index);
      const newFiles = prev.filesByReceipt.filter((_, i) => i !== index);
      return {
        ...prev,
        receipts: newReceipts,
        filesByReceipt: reindexFilesByReceipt(newFiles),
      };
    });
    setFileError(null);
  }, []);

  const replaceReceiptFiles = useCallback((receiptIndex: number, newForRow: FileData[]) => {
    setState((prev) => {
      const line = receiptIndex + 1;
      const stamped = newForRow.map((f) => ({...f, receiptLineIndex: line}));
      const nextRows = [...prev.filesByReceipt];
      nextRows[receiptIndex] = stamped;
      const total = nextRows.reduce((s, row) => s + row.length, 0);
      if (total > MAX_RECEIPT_FILE_RECORDS) {
        setFileError(
          'You can attach up to 8 receipt images or PDFs total (each upload stores an original and a converted copy).',
        );
        return prev;
      }
      setFileError(null);
      return {...prev, filesByReceipt: nextRows};
    });
  }, []);

  const appendReceiptFiles = useCallback((receiptIndex: number, filesToAppend: FileData[]) => {
    let didAppend = false;
    setState((prev) => {
      const line = receiptIndex + 1;
      const stamped = filesToAppend.map((file) => ({...file, receiptLineIndex: line}));
      const nextRows = [...prev.filesByReceipt];
      const existing = nextRows[receiptIndex] ?? [];
      nextRows[receiptIndex] = [...existing, ...stamped];
      const total = nextRows.reduce((sum, row) => sum + row.length, 0);
      if (total > MAX_RECEIPT_FILE_RECORDS) {
        setFileError(
          'You can attach up to 8 receipt images or PDFs total (each upload stores an original and a converted copy).',
        );
        return prev;
      }
      didAppend = true;
      setFileError(null);
      return {...prev, filesByReceipt: nextRows};
    });
    return didAppend;
  }, []);

  const removeFileFromReceipt = useCallback((receiptIndex: number, key: string) => {
    setState((prev) => {
      const nextRows = prev.filesByReceipt.map((row, i) =>
        i === receiptIndex ? row.filter((f) => f.key !== key) : row,
      );
      return {...prev, filesByReceipt: nextRows};
    });
    setFileError(null);
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
    const base = buildDefaultFormState();
    setState({
      ...base,
      requester: {
        ...base.requester,
        ...(saved || {}),
        dateOfRequest: getTodayDate(),
      },
    });
    setCurrentStep(0);
  }, []);

  const totalAmount = state.receipts.reduce((sum, r) => sum + (r.amount || 0), 0);

  const flattenFilesForSubmit = useCallback((): FileData[] => {
    return state.filesByReceipt.flat();
  }, [state.filesByReceipt]);

  const getReceiptBudgetAccount = useCallback(
    (index: number): string => {
      if (state.budget.splitAccounts && state.receipts[index]?.budgetAccount) {
        return state.receipts[index]?.budgetAccount ?? '';
      }
      return state.budget.primaryAccount;
    },
    [state.budget.splitAccounts, state.budget.primaryAccount, state.receipts],
  );

  return {
    state,
    currentStep,
    totalAmount,
    fileError,
    updateRequester,
    updateReceipt,
    addReceipt,
    removeReceipt,
    replaceReceiptFiles,
    appendReceiptFiles,
    removeFileFromReceipt,
    flattenFilesForSubmit,
    updateBudget,
    nextStep,
    prevStep,
    goToStep,
    reset,
    getReceiptBudgetAccount,
  };
}
