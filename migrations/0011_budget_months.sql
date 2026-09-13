-- Monthly budget CSVs generated from QuickBooks P&L uploads (admin).

CREATE TABLE budget_months (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  as_of_date TEXT NOT NULL,
  bank_balance_cents INTEGER NOT NULL,
  template_month_id TEXT,
  budget_r2_key TEXT NOT NULL,
  pl_r2_key TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL,
  FOREIGN KEY (template_month_id) REFERENCES budget_months(id)
);

CREATE UNIQUE INDEX idx_budget_months_label ON budget_months(label);
