/** @vitest-environment jsdom */
import {act, renderHook} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {MAX_RECEIPT_FILE_RECORDS} from '~/lib/reimbursement/validation';

import {useFormState} from '../useFormState';

describe('useFormState', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('hydrates saved requester fields from localStorage', () => {
    localStorage.setItem(
      'bhe-pta-requester-info',
      JSON.stringify({payableTo: 'P', email: 'p@bheeagles.com', phone: '', address: 'A'}),
    );
    const {result} = renderHook(() => useFormState());
    expect(result.current.state.requester.payableTo).toBe('P');
  });

  it('adds and removes receipt rows within limits', () => {
    const {result} = renderHook(() => useFormState());
    act(() => {
      for (let i = 0; i < 5; i++) result.current.addReceipt();
    });
    expect(result.current.state.receipts.length).toBe(4);
    act(() => {
      result.current.removeReceipt(0);
    });
    expect(result.current.state.receipts.length).toBeGreaterThan(0);
  });

  it('blocks file uploads beyond max records', () => {
    const {result} = renderHook(() => useFormState());
    const stubFile = (key: string) =>
      ({
        contentType: 'image/jpeg',
        filename: 'f.jpg',
        key,
        receiptLineIndex: 1,
        size: 1,
      }) as import('~/lib/reimbursement/validation').FileData;
    act(() => {
      result.current.replaceReceiptFiles(
        0,
        Array.from({length: MAX_RECEIPT_FILE_RECORDS + 1}, (_, i) => stubFile(`k${i}`)),
      );
    });
    expect(result.current.fileError).toBeTruthy();
  });

  it('navigates steps and computes totals', () => {
    const {result} = renderHook(() => useFormState());
    act(() => {
      result.current.updateReceipt(0, {amount: 3});
      result.current.nextStep();
      result.current.goToStep(10);
      result.current.prevStep();
    });
    expect(result.current.currentStep).toBeLessThan(4);
    expect(result.current.totalAmount).toBe(3);
  });

  it('updateRequester merges partial fields', () => {
    const {result} = renderHook(() => useFormState());
    act(() => {
      result.current.updateRequester({payableTo: 'Pat'});
    });
    expect(result.current.state.requester.payableTo).toBe('Pat');
  });

  it('silently ignores localStorage failures when saving requester info', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const {result} = renderHook(() => useFormState());
    act(() => {
      result.current.updateRequester({address: '1 Main St'});
    });
    spy.mockRestore();
    expect(result.current.state.requester.address).toBe('1 Main St');
  });

  it('ignores corrupt saved requester JSON', () => {
    localStorage.setItem('bhe-pta-requester-info', '{');
    const {result} = renderHook(() => useFormState());
    expect(result.current.state.requester.payableTo).toBe('');
  });

  it('appendReceiptFiles adds files to a row', () => {
    const {result} = renderHook(() => useFormState());
    const f = {
      contentType: 'image/jpeg',
      filename: 'f.jpg',
      key: 'uploads/1700000000000-00000000-0000-4000-8000-000000000001-x.jpg',
      receiptLineIndex: 1,
      size: 1,
    } as import('~/lib/reimbursement/validation').FileData;
    act(() => {
      result.current.appendReceiptFiles(0, [f]);
    });
    expect(result.current.state.filesByReceipt[0]).toHaveLength(1);
  });

  it('removeFileFromReceipt drops a file and clears file errors', () => {
    const {result} = renderHook(() => useFormState());
    const f = {
      contentType: 'image/jpeg',
      filename: 'f.jpg',
      key: 'uploads/1700000000000-00000000-0000-4000-8000-000000000001-x.jpg',
      receiptLineIndex: 1,
      size: 1,
    } as import('~/lib/reimbursement/validation').FileData;
    act(() => {
      result.current.appendReceiptFiles(0, [f]);
      result.current.removeFileFromReceipt(0, f.key);
    });
    expect(result.current.state.filesByReceipt[0]).toHaveLength(0);
  });

  it('appendReceiptFiles returns false when over the file cap', () => {
    const {result} = renderHook(() => useFormState());
    const stub = (i: number) =>
      ({
        contentType: 'image/jpeg',
        filename: `f${i}.jpg`,
        key: `uploads/1700000000000-00000000-0000-4000-8000-${i.toString(16).padStart(12, '0')}-x.jpg`,
        receiptLineIndex: 1,
        size: 1,
      }) as import('~/lib/reimbursement/validation').FileData;
    act(() => {
      result.current.replaceReceiptFiles(
        0,
        Array.from({length: MAX_RECEIPT_FILE_RECORDS}, (_, i) => stub(i)),
      );
    });
    let second = false;
    act(() => {
      second = result.current.appendReceiptFiles(0, [stub(255)]);
    });
    expect(second).toBe(false);
  });

  it('flattenFilesForSubmit returns all rows', () => {
    const {result} = renderHook(() => useFormState());
    const f = {
      contentType: 'image/jpeg',
      filename: 'f.jpg',
      key: 'uploads/1700000000000-00000000-0000-4000-8000-000000000001-x.jpg',
      receiptLineIndex: 1,
      size: 1,
    } as import('~/lib/reimbursement/validation').FileData;
    act(() => {
      result.current.appendReceiptFiles(0, [f]);
    });
    expect(result.current.flattenFilesForSubmit()).toHaveLength(1);
  });

  it('uses primary budget when split mode has empty per-receipt account', () => {
    const {result} = renderHook(() => useFormState());
    act(() => {
      result.current.updateBudget({primaryAccount: 'Library', splitAccounts: true});
      result.current.updateReceipt(0, {budgetAccount: ''});
    });
    expect(result.current.getReceiptBudgetAccount(0)).toBe('Library');
  });

  it('reset returns to step zero', () => {
    const {result} = renderHook(() => useFormState());
    act(() => {
      result.current.nextStep();
      result.current.reset();
    });
    expect(result.current.currentStep).toBe(0);
  });

  it('returns per-receipt budget when split mode is on', () => {
    const {result} = renderHook(() => useFormState());
    act(() => {
      result.current.updateBudget({primaryAccount: 'A', splitAccounts: true});
      result.current.updateReceipt(0, {budgetAccount: 'Row'});
    });
    expect(result.current.getReceiptBudgetAccount(0)).toBe('Row');
  });
});
