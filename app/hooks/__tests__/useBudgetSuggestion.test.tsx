/** @vitest-environment jsdom */
import {act, renderHook, waitFor} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {useBudgetSuggestion} from '../useBudgetSuggestion';

describe('useBudgetSuggestion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does nothing when receipts empty', async () => {
    const {result} = renderHook(() => useBudgetSuggestion());
    await act(async () => {
      await result.current.fetchSuggestions([]);
    });
    expect(result.current.loading).toBe(false);
  });

  it('loads suggestions on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({suggestions: [{account: 'Library', confidence: 'high'}]}),
        ok: true,
      }),
    );
    const {result} = renderHook(() => useBudgetSuggestion());
    await act(async () => {
      await result.current.fetchSuggestions([{amount: 1, description: 'Books'}], 'tok');
    });
    await waitFor(() => expect(result.current.suggestions).toHaveLength(1));
    expect(result.current.error).toBeNull();
  });

  it('sets error when response not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok: false, status: 500}));
    const {result} = renderHook(() => useBudgetSuggestion());
    await act(async () => {
      await result.current.fetchSuggestions([{amount: 1, description: 'x'}]);
    });
    await waitFor(() => expect(result.current.error).toBeTruthy());
  });

  it('sets error on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')));
    const {result} = renderHook(() => useBudgetSuggestion());
    await act(async () => {
      await result.current.fetchSuggestions([{amount: 1, description: 'x'}]);
    });
    await waitFor(() => expect(result.current.error).toBeTruthy());
  });
});
