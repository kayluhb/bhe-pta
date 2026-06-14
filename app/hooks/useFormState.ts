import {useCallback, useEffect, useState} from 'react';
import {randomUUID} from '~/lib/random-uuid';
import {isValidReimbursementDraftId} from '~/lib/reimbursement/filename';
import {
  type BudgetSelectionData,
  type FileData,
  MAX_RECEIPT_LINES,
  MAX_RECEIPT_UPLOADS,
  type ReceiptData,
  type ReceiptUploadData,
  type RequesterData,
} from '~/lib/reimbursement/validation';

const STORAGE_KEY = 'bhe-pta-requester-info';
const REIMBURSEMENT_DRAFT_SESSION_KEY = 'bhe-pta-reimbursement-draft-id';

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
  /** Stable client id for this draft (`{ms}-{uuid}`); pairs with payable name on submitted files. */
  reimbursementDraftId: string;
  requester: RequesterData;
  receipts: ReceiptData[];
  /** One array per receipt row; each entry is the original file from a single upload (carries its `jobId`). */
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
    clientKey: randomUUID(),
    date: getTodayDate(),
    description: '',
    amount: 0,
    placeOfPurchase: '',
    budgetAccount: '',
  };
}

/** Must not call `randomUUID()` at module scope (Cloudflare Workers disallow I/O in global scope). */
function buildDefaultFormState(): FormState {
  return {
    reimbursementDraftId: '',
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
  return rows.map((files, i) => files.map((f) => ({...f, receiptLineIndex: i + 1})));
}

function loadOrCreateReimbursementDraftId(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  try {
    const existing = sessionStorage.getItem(REIMBURSEMENT_DRAFT_SESSION_KEY);
    if (existing && isValidReimbursementDraftId(existing)) {
      return existing;
    }
  } catch {
    // ignore
  }
  const id = `${Date.now()}-${randomUUID()}`;
  try {
    sessionStorage.setItem(REIMBURSEMENT_DRAFT_SESSION_KEY, id);
  } catch {
    // ignore
  }
  return id;
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

  useEffect(() => {
    const id = loadOrCreateReimbursementDraftId();
    if (!id) return;
    setState((prev) =>
      prev.reimbursementDraftId === id ? prev : {...prev, reimbursementDraftId: id},
    );
  }, []);

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
      if (prev.receipts.length >= MAX_RECEIPT_LINES) return prev;
      const lastReceipt = prev.receipts[prev.receipts.length - 1];
      return {
        ...prev,
        receipts: [
          ...prev.receipts,
          {
            clientKey: randomUUID(),
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
      if (total > MAX_RECEIPT_UPLOADS) {
        setFileError(`You can attach up to ${MAX_RECEIPT_UPLOADS} receipt images or PDFs total.`);
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
      if (total > MAX_RECEIPT_UPLOADS) {
        setFileError(`You can attach up to ${MAX_RECEIPT_UPLOADS} receipt images or PDFs total.`);
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
    try {
      sessionStorage.removeItem(REIMBURSEMENT_DRAFT_SESSION_KEY);
    } catch {
      // ignore
    }
    const reimbursementDraftId = loadOrCreateReimbursementDraftId();
    setState({
      ...base,
      reimbursementDraftId,
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

  const flattenReceiptUploadsForSubmit = useCallback((): ReceiptUploadData[] => {
    const out: ReceiptUploadData[] = [];
    for (const row of state.filesByReceipt) {
      for (const file of row) {
        if (file.jobId) {
          out.push({jobId: file.jobId, receiptLineIndex: file.receiptLineIndex});
        }
      }
    }
    return out;
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
    flattenReceiptUploadsForSubmit,
    updateBudget,
    nextStep,
    prevStep,
    goToStep,
    reset,
    getReceiptBudgetAccount,
  };
}
