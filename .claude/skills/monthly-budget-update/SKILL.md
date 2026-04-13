---
name: monthly-budget-update
description: Use when converting a QuickBooks Profit and Loss Detail CSV into the monthly PTA budget spreadsheet, or when the user asks to create a new month's budget CSV from P&L data
---

# Monthly Budget Update

Convert a QuickBooks "Profit and Loss Detail" CSV into the PTA budget spreadsheet format. The previous month's budget CSV is the template; update the actuals column with current P&L totals.

## Process

1. Read the previous month's budget CSV and the new `Profit and Loss Detail.csv`
2. Ask the user:
   - Current bank balance (for the header)
   - Whether budget/proposed columns changed (usually no)
   - How to handle decreased actuals vs previous month (usually QB reclassifications — use P&L as-is)
3. Extract "Total for ..." lines from P&L and map to budget lines (see tables below)
4. Round all amounts to nearest whole dollar
5. Update header: new balance, date, key changes notes
6. Recalculate carry-forward, income, and expense totals
7. Write new CSV (e.g., `March 2026.csv`)

## Category Mapping: Income

| P&L Category | Budget Line |
|---|---|
| Fun Raising - Group Dining | Fun Raising (Dine-in donations) |
| Sales - Merchandise | Add to Store total |
| Store (Online and on campus) | Store (Online and on campus) |
| Contributions > Business Contributions | Business contributions |
| Carnival Income (total w/ subs) | Fundraiser #1 (Carnival) |
| Parties with a Purpose | Community Fundraisers/Parties with a Purpose |
| Spring Fling | Fundraiser #2 (Spring Fling) |
| Annual Fund > Business Contributions | Annual Fund — Businesses |
| Annual Fund > Family Contributions | Annual Fund — Families |

**Static** (unchanged): Initial bank balance.

**Carry-Forward Section** (these live in the CARRY-FORWARD section, not INCOME): Required minimum cash reserve, Teacher Grant carry-forward, Academic Enrichment carry-forward.

**Ignore**: Contributions > Grants > Greenworks (negative QB offset), Cost of Goods Sold (not in budget).

## Category Mapping: Expenses

| P&L Category | Budget Line |
|---|---|
| ACPTA Mini Equity Grants | ACPTA Mini-Grants & Austin Ed Grants |
| Taxes - sales | Sales tax |
| Teacher Appreciation/Retirement | Teacher retirement/commemoration |
| Unified Champions | Unified Champions |
| Academic Enrichment | Academic Enrichment |
| Class Gardens | Class gardens |
| Community Events | Community events |
| Courtesy | Courtesy |
| Cultural Arts | Cultural arts |
| End of Semester Gifts | Hospitality - End of semester gifts |
| GreenWorks (formerly Landscapin) | GreenWorks |
| Hospitality | Hospitality - Monthly teacher appreciation event |
| Library | Library |
| P.E. Fund | P.E. Fund/Ninja |
| Teacher's Lounge Food & Drinks | Teacher lounge coffee & food |
| Scholarships > Nick Akery | Nick Akery scholarship |
| Accounting | Admin - Accounting |
| ACPTA Dues | Admin - ACPTA dues |
| Google Drive | Admin - Google Drive |
| Liability Insurance | Admin - Liability insurance |
| Membership Management | Admin - Membership management |
| Texas PTA Dues | Admin - Membership dues to TXPTA |
| Website | Admin - Website |
| Carnival Expenses | Fundraiser #1 (Carnival) |
| Online Store | Online Store — cost of goods |
| Spring Fling Expenses | Fundraiser #2 (Spring Fling) |
| Sponsor Signs | Fundraiser - Sponsorship signs |
| Counselor | Counselor's fund |
| Snacks | Snacks for classrooms |
| Special Area Teachers | Classroom - Special Areas teacher reimbursement |
| Teacher Reimbursement | Classroom - Teacher reimbursement |
| School T-Shirts + Field Day T-Shirts | Student & teacher merch |
| Yearbook Printing | Yearbook |
| Teacher Grants Fall | Teacher grant program for Fall |
| Teacher Grants Spring | Teacher grant program for Spring |
| School Improvements | School Improvements |

**Static/Carry-Forward** (these live in the CARRY-FORWARD section, NOT in EXPENSES): Academic Enrichment carry-forward, Teacher grant carry forward, Required minimum cash reserve. These are always $2,500, $10,000, and $15,000 respectively — never mapped from P&L.

## CSV Format

- **Columns**: Category | Fall Approved Budget | Budget Actuals as of [date] | Mid Year Proposed Budget | Notes | (empty) | (extra notes)
- **Numbers**: Whole dollars. Values with commas get CSV quotes (`"$8,400"`), others don't (`$500`).
- **Blank vs $0**: Blank = no activity ever. `$0` = explicitly zero.
- **Row 1**: Title cell, balance cell, available-for-expenses cell, empty cell, then multiline quoted cell with key changes (embedded newlines).
  - Balance cell (B1): `current balance $XX,XXX.00` — the bank balance the user provides.
  - Available for expenses cell (C1): `available for expenses $XX,XXX.00` — calculated as current balance minus carry-forward total (e.g. $59,011 - $27,500 = $31,511).
- **Date**: Update "Budget Actuals as of [date]" in INCOME and EXPENSES header rows.

### Three-Section Layout

The CSV has three sections after the header, separated by blank rows:

1. **CARRY-FORWARD FROM 2024-25** — reserved funds that pass through unchanged year-over-year. Contains: Required minimum cash reserve, Teacher Grant carry-forward, Academic Enrichment carry-forward. Includes a total row.
2. **INCOME (2025-26 Activity)** — actual income earned this year only. Initial bank balance stays here. No carry-forward lines.
3. **EXPENSES (2025-26 Activity)** — actual expenses spent this year only. No carry-forward lines.

This separation makes it clear what the PTA actually raised and spent vs. what was already reserved from prior years. The carry-forward items appear once (not duplicated on income and expense sides).

## Header Key Changes Format

```
  Key changes from [Previous Month]:

  Income:
  - [line]: $old -> $new (+$diff, [source] in [month])

  Expenses:
  - New activity: [line] $amount, ...
  - Increases: [line] $old->$new, ...
  - Reclassified: [line] $old->$new, ... (if QB reclassifications)
```

## Common Issues

- **Amounts decrease between months**: Usually QuickBooks reclassifications. Confirm with user, use P&L as-is.
- **New P&L categories**: Ask user where to map them.
- **Greenworks Grants**: Negative income in P&L (checks on income account). Don't map — QB internal offset.
- **Budget totals won't match bank balance**: Expected due to outstanding checks, deposits in transit, rounding.
