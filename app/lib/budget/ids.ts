export const BUDGET_MONTH_ID_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function assertValidBudgetMonthId(id: string): string | null {
  if (!BUDGET_MONTH_ID_RE.test(id)) {
    return 'Month id must be YYYY-MM (e.g. 2026-09)';
  }
  return null;
}

export function budgetCsvR2Key(monthId: string): string {
  return `budgets/${monthId}/budget.csv`;
}

export function plCsvR2Key(monthId: string): string {
  return `budgets/${monthId}/pl.csv`;
}

export type BudgetMonthRow = {
  as_of_date: string;
  bank_balance_cents: number;
  budget_r2_key: string;
  created_at: string;
  created_by: string;
  id: string;
  label: string;
  pl_r2_key: string | null;
  template_month_id: string | null;
  updated_at: string;
};
