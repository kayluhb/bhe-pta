# Membership import admin route — design

Status: approved (verbally, in chat) 2026-09-09. Implementation via writing-plans next.

## Problem

Each year the PTA membership chair downloads a Cheddar Up export of membership-form
responses (`PTA_Membership_Information.csv`) and hand-converts it into the Texas PTA
member-import CSV that gets uploaded into MyPTEZ. That conversion is currently a one-off
script (see the sibling `2025-26/membership` project) with real edge cases already found
by hand this session: repeat submissions with swapped parent roles, synthetic per-child
emails, address defaults, non-name text in the child field, and a `PaidDate` value that
MyPTEZ rejects if it falls before the start of the current member year.

The chair also re-uploads a fuller export partway through the season as more people sign
up, and needs the tool to emit only the members not already exported, so MyPTEZ doesn't
get duplicate rows.

This adds an admin route to `bhe-pta` that does this conversion, and remembers who's
already been exported for a given school year.

Out of scope (see `pta-membership-workflow` note): importing into MyPTEZ itself, and the
MyPTEZ dues-summary → Texas PTA roster upload step. This route only produces the CSV that
gets fed into MyPTEZ.

## Data model

New migration `0011_pta_members.sql`:

```sql
CREATE TABLE pta_members (
  id TEXT PRIMARY KEY,
  school_year_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('primary', 'spouse', 'child')),
  email TEXT NOT NULL,               -- lowercased
  first_name TEXT NOT NULL,
  middle_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  zip TEXT NOT NULL DEFAULT '',
  home_phone TEXT NOT NULL DEFAULT '',
  cell_phone TEXT NOT NULL DEFAULT '',
  lifetime INTEGER NOT NULL DEFAULT 0 CHECK (lifetime IN (0, 1)),
  paid_date TEXT NOT NULL,           -- MM/DD/YYYY, as exported
  source_document_number TEXT NOT NULL DEFAULT '',  -- Cheddar Up submission id, for traceability
  imported_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX idx_pta_members_year_email ON pta_members(school_year_id, email);
```

No `FOREIGN KEY` to `school_years(id)` — matches the existing convention in
`0008_school_years.sql` (D1 can't add a FK'd `NOT NULL` column via `ALTER`, and the app
already enforces this relationship in code elsewhere). `school_year_id` is validated
against `school_years` in the route.

Row = one *exported* person (already used to generate a CSV row), not a Cheddar Up
submission. The unique index is the actual duplicate guard; app logic just makes the
common case (skip already-tracked emails) efficient and gives a clean summary count.

## Conversion module — `app/lib/membership/`

Pure functions, framework-agnostic, so they're unit-testable without D1/R2:

- `parseCheddarUpExport(csvText: string): FamilyRecord[]` — parses via `papaparse`
  (new dependency; the child-name field can contain embedded newlines inside a quoted
  cell, which a hand-rolled splitter won't handle reliably). Validates the header row
  against the known 23-column layout (see `EXPECTED_HEADER` — two of the columns
  legitimately repeat: `City`, `State/Province`, `Zip/Postal Code` each appear once for
  the primary parent and once for the additional parent) and throws a descriptive
  `MembershipImportError` if the shape doesn't match, rather than silently
  mis-mapping columns. This is a real risk: the column layout already changed once
  between the 2025-26 and 26-27 exports.
- `clusterDuplicateSubmissions(records): FamilyRecord[]` — collapses repeat submissions
  within one upload (families who filled the form out twice), matching on shared
  normalized street address or any shared parent email — matching on email alone misses
  cases where parent roles were swapped between submissions. Keeps the most recent
  (or, on a date tie, the more complete) submission.
- `buildMemberRows(records, {schoolYearStartsOn}): MemberRow[]` — splits each family into
  primary/spouse/child rows: spouse/child emails synthesized via plus-addressing off the
  primary's email when not given; blank city/state/zip default to Austin/Texas/78704;
  child-field lines that don't parse to an alphabetic first name (e.g. `"3 BHE alumni"`)
  are skipped, not imported as a person; `PaidDate` is clamped to
  `max(originalDate, schoolYearStartsOn)`.
- `toImportCsv(rows: MemberRow[]): string` — renders the 15-column Texas PTA import CSV
  (reusing the same `escapeCsvValue` approach as `api.admin.reimbursements-export.ts`).

Types live in `app/lib/membership/types.ts`. Behavior above is exactly what was verified
by hand against the real 26-27 export this session — see the `pta-membership-import-quirks`
memory for the specific families that motivated each rule.

## Route

**Page**: `admin/membership` (`admin.membership.tsx`) — follows the `admin.school-years.tsx`
shape: `requireAdmin` in the loader, a `<select>` of `school_years` (defaulting to the
`is_default` row) plus a file input and "Generate" button. On submit, POSTs the file via
`fetch` + `FormData` to the API route, reads the response as a blob, and triggers a
download (`URL.createObjectURL` + a synthetic `<a>` click) — the same client-side pattern
used for bulk PDF/zip downloads elsewhere in admin. Response summary counts (new /
already-tracked / skipped-non-name) come back as response headers
(`X-New-Count`, `X-Already-Tracked-Count`, `X-Skipped-Count`) and are shown as a toast/
banner after the download starts.

**API**: `POST api/admin/membership/import` (`api.admin.membership-import.ts`):

1. `requireAdmin`.
2. Read `schoolYearId` and `file` from `request.formData()`; 400 if either missing, or if
   `schoolYearId` doesn't exist in `school_years`.
3. `parseCheddarUpExport` → `clusterDuplicateSubmissions` → `buildMemberRows` (using that
   year's `starts_on` as the `PaidDate` floor). 400 with the parser's message on a shape
   mismatch.
4. Query existing `pta_members` emails for that `school_year_id` into a `Set`.
5. Partition rows into `newRows` (email not in the set) / `alreadyTracked`. Within
   `newRows`, guard against an internal duplicate email (extremely rare — a plus-address
   collision) by keeping the first and counting the rest as `skipped`.
6. `db.batch(...)` insert `newRows` into `pta_members`.
7. Return `toImportCsv(newRows)` as the response body with
   `Content-Disposition: attachment; filename="pta-import-<schoolYearId>-<date>.csv"`,
   `Content-Type: text/csv`, and the summary headers from step 5/6.

If `newRows` is empty (nothing new since the last upload), still return a valid
(header-only) CSV rather than an error — "no new members" is an expected, unremarkable
outcome of a re-upload.

## Testing

- Unit tests for the four conversion functions against fixture CSVs built from the real
  edge cases found this session (duplicate submission with swapped roles, non-name child
  line, blank address, spouse with/without own email). `vitest` is already configured for
  the repo (`vitest.config.ts`) even though the CLAUDE.md note about "no test framework
  configured" predates it — first real unit tests for this repo's `app/lib`.
- One route-level test (or manual QA via `pnpm dev`) for the full upload → filtered CSV →
  re-upload → empty-diff round trip against a local D1 (`wrangler d1 migrations apply
  ... --local`).

## Known limitations (explicitly out of scope for v1)

- No UI to browse/edit/remove individual `pta_members` rows (confirmed acceptable —
  upload + download only for now).
- The exact MyPTEZ `PaidDate` acceptance rule is still unconfirmed beyond "on/after
  08/02/2026 worked, 07/01 and 08/01 did not" for the 26-27 year; clamping to
  `school_years.starts_on` is a best-effort proxy, not a verified rule. If MyPTEZ rejects
  a clamped date again, the fix is either adjusting that year's `starts_on` or adding an
  explicit override — not re-deriving the rule from scratch.
- If the Cheddar Up export's column layout changes again, the route fails closed (400)
  rather than guessing — the header layout will need a code update, not just data cleanup.
