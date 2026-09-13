# Admin P&L → Monthly Budget Upload

## Goal

Treasurers upload a QuickBooks Profit and Loss Detail CSV in admin, pick a template month and target month, enter the current bank balance, and generate a monthly budget CSV stored on the site for list/download. Public `/budget` remains a Google Sheet redirect.

## Decisions

- **Storage:** D1 `budget_months` metadata + R2 CSVs (`budgets/{id}/budget.csv`, optional `pl.csv`)
- **Template:** Admin selects which prior stored month to use
- **Target month:** Admin selects/enters the month being generated (re-runs allowed)
- **Overwrite:** Same month id replaces R2 objects and updates the D1 row
- **Seed:** First month can be seeded by uploading an existing budget CSV (no P&L)

## Converter

Pure TypeScript (no AI). Maps P&L `Total for …` lines (with account path context) to budget lines per `.claude/skills/monthly-budget-update/SKILL.md`. Preserves Fall Approved / Notes from the template; updates actuals, section totals, header balance / available-for-expenses, and auto key-changes notes. Category actuals round to whole dollars; bank balance keeps cents.

## Admin UI

`/admin/budgets`: list stored months with downloads; seed form; generate form (P&L file, template month, target month id/label, as-of date, bank balance).

## Non-goals (v1)

- Public budget page changes
- Google Sheets sync
- Version history per month
