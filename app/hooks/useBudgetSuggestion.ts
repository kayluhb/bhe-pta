import {useCallback, useState} from 'react';

interface ReceiptInput {
  amount: number;
  description: string;
  placeOfPurchase?: string;
}

export interface BudgetSuggestion {
  account: string;
  confidence: 'high' | 'medium' | 'low';
}

interface BudgetSuggestionState {
  error: string | null;
  loading: boolean;
  suggestions: (BudgetSuggestion | null)[];
}

export function useBudgetSuggestion() {
  const [state, setState] = useState<BudgetSuggestionState>({
    error: null,
    loading: false,
    suggestions: [],
  });

  const fetchSuggestions = useCallback(async (receipts: ReceiptInput[], turnstileToken?: string | null) => {
    if (receipts.length === 0) return;

    setState({error: null, loading: true, suggestions: []});

    try {
      const response = await fetch('/api/reimbursement/suggest-budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(turnstileToken ? {'X-Turnstile-Token': turnstileToken} : {}),
        },
        body: JSON.stringify({
          receipts: receipts.map((r) => ({
            amount: r.amount,
            description: r.description,
            placeOfPurchase: r.placeOfPurchase,
          })),
        }),
      });

      if (!response.ok) {
        setState({error: 'Failed to get suggestions', loading: false, suggestions: []});
        return;
      }

      const data = (await response.json()) as {suggestions: (BudgetSuggestion | null)[]};
      setState({error: null, loading: false, suggestions: data.suggestions ?? []});
    } catch {
      setState({error: 'Failed to get suggestions', loading: false, suggestions: []});
    }
  }, []);

  return {
    ...state,
    fetchSuggestions,
  };
}
