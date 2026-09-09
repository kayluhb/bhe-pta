# Membership Import Admin Route Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin route that turns a Cheddar Up membership-form export into a Texas
PTA member-import CSV, tracking who's already been exported for a school year so a later
re-upload only emits new members.

**Architecture:** A small pure-function pipeline in `app/lib/membership/` (parse → dedupe
duplicate submissions → build per-person rows → render CSV), driven by one admin page +
one API action following this repo's existing `admin.school-years.tsx` /
`api.admin.school-years.ts` pattern. A new `pta_members` D1 table (in the existing
`REIMBURSEMENT_DB`) records every row already exported, keyed by `(school_year_id, email)`.

**Tech Stack:** React Router 8 (SSR, Cloudflare Workers), D1 (raw SQL), `papaparse` (new
dependency, for CSV parsing), Vitest.

**Spec:** `docs/superpowers/specs/2026-09-09-membership-import-design.md`

## Global Constraints

- Reuse the existing `school_years` table/concept for "this year" — don't invent a
  separate year concept.
- Dedup identity is **email**, case-insensitive.
- v1 scope is upload → download only; no UI to browse/edit/remove `pta_members` rows.
- `PaidDate` on every emitted row is clamped to `max(originalDate, schoolYear.starts_on)`.
- No `FOREIGN KEY` on `pta_members.school_year_id` (matches the existing
  `0008_school_years.sql` convention — D1 can't add an FK'd `NOT NULL` column via `ALTER`,
  and the codebase already enforces this relationship in application code elsewhere).
- Code style: single quotes, semicolons, no bracket spacing, 100-col lines, alphabetized
  object/interface members and JSX props (Biome `assist.actions.source` is on for this —
  run `pnpm lint:fix` if unsure). Never reassign a function parameter (`noParameterAssign`
  is an error).
- `app/lib/**/*.ts` is coverage-gated (branches ≥ 86%, lines ≥ 99%, functions ≥ 93%,
  project-wide) — the new `app/lib/membership/*.ts` files need thorough unit tests.
  Route/page files are not coverage-gated; this repo has no automated tests for page
  components (verify those manually via `pnpm dev`).

---

## File Structure

| File | Responsibility |
|---|---|
| `migrations/0011_pta_members.sql` | New table tracking exported members per school year |
| `app/lib/membership/types.ts` | Shared types: `PersonFields`, `RawFamilySubmission`, `MemberRole`, `MemberRow` |
| `app/lib/membership/errors.ts` | `MembershipImportError` |
| `app/lib/membership/csv-output.ts` | Render `MemberRow[]` as the Texas PTA import CSV |
| `app/lib/membership/parse.ts` | Parse + validate the raw Cheddar Up export into `RawFamilySubmission[]` |
| `app/lib/membership/dedupe.ts` | Collapse repeat submissions within one upload |
| `app/lib/membership/build-rows.ts` | Split each family into primary/spouse/child `MemberRow`s |
| `app/routes/api.admin.membership-import.ts` | The action: parse → dedupe → build → filter against `pta_members` → insert → respond with CSV |
| `app/routes/admin.membership.tsx` | The page: pick a school year, upload a file, download the result |
| `app/routes.ts` | Register both new routes |
| `app/routes/admin.reimbursements.tsx`, `app/routes/admin.school-years.tsx` | Add a "Membership" nav link |

---

### Task 1: `pta_members` migration

**Files:**
- Create: `migrations/0011_pta_members.sql`

**Interfaces:**
- Produces: table `pta_members` with columns `id, school_year_id, role, email, first_name,
  middle_name, last_name, gender, address, city, state, zip, home_phone, cell_phone,
  lifetime, paid_date, source_document_number, imported_at`, and a unique index
  `idx_pta_members_year_email` on `(school_year_id, email)`.

- [ ] **Step 1: Write the migration**

```sql
-- Tracks every person already exported into a Texas PTA import CSV, per school year, so
-- re-uploading a fuller Cheddar Up export only emits people not already exported.

CREATE TABLE pta_members (
  id TEXT PRIMARY KEY,
  school_year_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('primary', 'spouse', 'child')),
  email TEXT NOT NULL,
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
  paid_date TEXT NOT NULL,
  source_document_number TEXT NOT NULL DEFAULT '',
  imported_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX idx_pta_members_year_email ON pta_members(school_year_id, email);
```

- [ ] **Step 2: Apply it to the local D1 database**

Run: `pnpm dev:migrate`
Expected: output includes `Migrations to be applied: 0011_pta_members.sql` then success,
no errors.

- [ ] **Step 3: Verify the table shape**

Run: `wrangler d1 execute pta-reimbursement-db --local --command "PRAGMA table_info(pta_members);"`
Expected: 18 rows listing the columns above.

- [ ] **Step 4: Commit**

```bash
git add migrations/0011_pta_members.sql
git commit -m "Add pta_members table for membership-import tracking"
```

---

### Task 2: `MemberRow` type + CSV rendering

**Files:**
- Create: `app/lib/membership/types.ts`
- Create: `app/lib/membership/csv-output.ts`
- Test: `app/lib/membership/__tests__/csv-output.test.ts`

**Interfaces:**
- Produces: `MemberRole = 'primary' | 'spouse' | 'child'`; `MemberRow` (fields: `address,
  cellPhone, city, email, firstName, homePhone, lastName, lifetime: boolean, middleName,
  paidDate: string, role: MemberRole, sourceDocumentNumber, state, zip` — all strings
  except `lifetime`); `IMPORT_CSV_COLUMNS`, `escapeCsvValue(value: string): string`,
  `deriveMemberYear(paidDate: string): string` (throws on unparseable input),
  `toImportCsv(rows: MemberRow[]): string` from `csv-output.ts`.

- [ ] **Step 1: Write `types.ts`**

```typescript
export type MemberRole = 'primary' | 'spouse' | 'child';

export interface MemberRow {
  address: string;
  cellPhone: string;
  city: string;
  email: string;
  firstName: string;
  homePhone: string;
  lastName: string;
  lifetime: boolean;
  middleName: string;
  paidDate: string;
  role: MemberRole;
  sourceDocumentNumber: string;
  state: string;
  zip: string;
}
```

- [ ] **Step 2: Write the failing test for `csv-output.ts`**

```typescript
import {describe, expect, it} from 'vitest';
import {deriveMemberYear, escapeCsvValue, IMPORT_CSV_COLUMNS, toImportCsv} from '../csv-output';
import type {MemberRow} from '../types';

function buildRow(overrides: Partial<MemberRow> = {}): MemberRow {
  return {
    address: '123 Main St',
    cellPhone: '+15125551234',
    city: 'Austin',
    email: 'parent@example.com',
    firstName: 'Pat',
    homePhone: '',
    lastName: 'Example',
    lifetime: false,
    middleName: '',
    paidDate: '09/08/2026',
    role: 'primary',
    sourceDocumentNumber: 'DOC1',
    state: 'Texas',
    zip: '78704',
    ...overrides,
  };
}

describe('escapeCsvValue', () => {
  it('leaves plain values unchanged', () => {
    expect(escapeCsvValue('Pat')).toBe('Pat');
  });

  it('quotes and escapes values containing commas, quotes, or newlines', () => {
    expect(escapeCsvValue('Smith, Jr.')).toBe('"Smith, Jr."');
    expect(escapeCsvValue('She said "hi"')).toBe('"She said ""hi"""');
    expect(escapeCsvValue('line1\nline2')).toBe('"line1\nline2"');
  });
});

describe('deriveMemberYear', () => {
  it('extracts the 4-digit year from a MM/DD/YYYY date', () => {
    expect(deriveMemberYear('09/08/2026')).toBe('2026');
  });

  it('throws when no 4-digit year is present', () => {
    expect(() => deriveMemberYear('not-a-date')).toThrow(/Cannot derive MemberYear/);
  });
});

describe('toImportCsv', () => {
  it('renders the header followed by one line per row', () => {
    const csv = toImportCsv([buildRow()]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe(IMPORT_CSV_COLUMNS.join(','));
    expect(lines[1]).toBe(
      '2026,,Pat,,Example,,parent@example.com,123 Main St,Austin,Texas,78704,,+15125551234,FALSE,09/08/2026',
    );
  });

  it('renders Lifetime as TRUE when set', () => {
    const csv = toImportCsv([buildRow({lifetime: true})]);
    expect(csv.split('\n')[1]).toContain(',TRUE,');
  });

  it('renders an empty row set as just the header', () => {
    expect(toImportCsv([])).toBe(IMPORT_CSV_COLUMNS.join(','));
  });

  it('escapes a value that needs it', () => {
    const csv = toImportCsv([buildRow({lastName: 'Smith, Jr.'})]);
    expect(csv.split('\n')[1]).toContain('"Smith, Jr."');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm vitest run app/lib/membership/__tests__/csv-output.test.ts`
Expected: FAIL — `../csv-output` cannot be found.

- [ ] **Step 4: Write `csv-output.ts`**

```typescript
import type {MemberRow} from './types';

export const IMPORT_CSV_COLUMNS = [
  'MemberYear',
  'Type',
  'FirstName',
  'MiddleName',
  'LastName',
  'Gender',
  'Email',
  'Address',
  'City',
  'State',
  'Zip',
  'HomePhone',
  'CellPhone',
  'Lifetime',
  'PaidDate',
] as const;

export function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function deriveMemberYear(paidDate: string): string {
  const match = paidDate.match(/\d{4}/);
  if (!match) {
    throw new Error(`Cannot derive MemberYear from PaidDate "${paidDate}"`);
  }
  return match[0];
}

export function toImportCsv(rows: MemberRow[]): string {
  const lines = rows.map((row) =>
    [
      deriveMemberYear(row.paidDate),
      '',
      row.firstName,
      row.middleName,
      row.lastName,
      '',
      row.email,
      row.address,
      row.city,
      row.state,
      row.zip,
      row.homePhone,
      row.cellPhone,
      row.lifetime ? 'TRUE' : 'FALSE',
      row.paidDate,
    ]
      .map(escapeCsvValue)
      .join(','),
  );
  return [IMPORT_CSV_COLUMNS.join(','), ...lines].join('\n');
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm vitest run app/lib/membership/__tests__/csv-output.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 6: Lint and commit**

```bash
pnpm lint:fix
git add app/lib/membership/types.ts app/lib/membership/csv-output.ts app/lib/membership/__tests__/csv-output.test.ts
git commit -m "Add MemberRow type and Texas PTA import CSV rendering"
```

---

### Task 3: Parse the Cheddar Up export

**Files:**
- Modify: `app/lib/membership/types.ts` (add `PersonFields`, `RawFamilySubmission`)
- Create: `app/lib/membership/errors.ts`
- Create: `app/lib/membership/parse.ts`
- Test: `app/lib/membership/__tests__/parse.test.ts`

**Interfaces:**
- Consumes: nothing from prior tasks (parallel to Task 2's output types, but adds its own).
- Produces: `MembershipImportError` (extends `Error`); `PersonFields` (fields: `city,
  email, firstName, lastName, phone, state, street, streetLine2, zip`, all strings);
  `RawFamilySubmission` (fields: `additional: PersonFields | null,
  additionalStreetGiven: boolean, childLines: string[], documentNumber: string,
  paidDate: string, primary: PersonFields`); `parseCheddarUpExport(csvText: string):
  RawFamilySubmission[]` from `parse.ts`.

- [ ] **Step 1: Add the family/person types to `types.ts`**

Add to `app/lib/membership/types.ts` (keep the existing `MemberRole`/`MemberRow`):

```typescript
export interface PersonFields {
  city: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  state: string;
  street: string;
  streetLine2: string;
  zip: string;
}

export interface RawFamilySubmission {
  additional: PersonFields | null;
  additionalStreetGiven: boolean;
  childLines: string[];
  documentNumber: string;
  paidDate: string;
  primary: PersonFields;
}
```

- [ ] **Step 2: Write `errors.ts`**

```typescript
export class MembershipImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MembershipImportError';
  }
}
```

- [ ] **Step 3: Add the `papaparse` dependency**

Run: `pnpm add papaparse && pnpm add -D @types/papaparse`
Expected: both added to `package.json` (`papaparse` under `dependencies`, `@types/papaparse`
under `devDependencies`); `pnpm-lock.yaml` updated.

- [ ] **Step 4: Write the failing test for `parse.ts`**

```typescript
import {describe, expect, it, vi} from 'vitest';
import {MembershipImportError} from '../errors';
import {parseCheddarUpExport} from '../parse';

const HEADER = [
  'Respondent',
  'Email',
  'Date',
  'Your first name',
  'Your last name',
  'Your email address',
  'Your street address',
  'City',
  'State/Province',
  'Zip/Postal Code',
  'Street Address, Line 2',
  'Your phone number',
  'Child name(s), grade(s), homeroom teacher(s) — one line per child please',
  'Additional parent first name',
  'Additional parent last name',
  'Additional parent email',
  'Additional parent phone number',
  'City',
  'State/Province',
  'Zip/Postal Code',
  'Additional parent street address (leave blank if the same)',
  'Street Address, Line 2',
  'Document Number',
].join(',');

function csvRow(cells: string[]): string {
  return cells.map((cell) => (cell.includes(',') || cell.includes('\n') ? `"${cell}"` : cell)).join(',');
}

describe('parseCheddarUpExport', () => {
  it('parses a full family row into primary + additional + child lines', () => {
    const row = csvRow([
      'Erin Lefler',
      'elefler14@gmail.com',
      '09/08/2026',
      'Erin',
      'Lefler',
      'elefler14@gmail.com',
      '2319 Westoak Drive',
      'Austin',
      'TX',
      '78704',
      '',
      '+15129499510',
      'Everett Hopkins, 1st, Goodin',
      'Franklin',
      'Hopkins',
      'efranklinhopkinsiv@gmail.com',
      '+15127508020',
      'Austin',
      'TX',
      '78704',
      '',
      '',
      'L1S0Q',
    ]);
    const [record] = parseCheddarUpExport(`${HEADER}\n${row}`);

    expect(record.primary).toEqual({
      city: 'Austin',
      email: 'elefler14@gmail.com',
      firstName: 'Erin',
      lastName: 'Lefler',
      phone: '+15129499510',
      state: 'TX',
      street: '2319 Westoak Drive',
      streetLine2: '',
      zip: '78704',
    });
    expect(record.additional).toEqual({
      city: 'Austin',
      email: 'efranklinhopkinsiv@gmail.com',
      firstName: 'Franklin',
      lastName: 'Hopkins',
      phone: '+15127508020',
      state: 'TX',
      street: '',
      streetLine2: '',
      zip: '78704',
    });
    expect(record.additionalStreetGiven).toBe(false);
    expect(record.childLines).toEqual(['Everett Hopkins, 1st, Goodin']);
    expect(record.documentNumber).toBe('L1S0Q');
    expect(record.paidDate).toBe('09/08/2026');
  });

  it('strips a leading UTF-8 BOM before validating the header', () => {
    const row = csvRow(Array.from({length: 23}, () => ''));
    const withBom = `\uFEFF${HEADER}\n${row}`;
    expect(() => parseCheddarUpExport(withBom)).not.toThrow();
  });

  it('splits multiple child lines and drops blank ones', () => {
    const row = csvRow([
      'Jacqueline Keifer',
      'jacq.keifer@gmail.com',
      '09/15/2026',
      'Jacqueline',
      'Keifer',
      'jacq.keifer@gmail.com',
      '4602 Jinx Ave',
      '',
      '',
      '',
      '',
      '+12147554943',
      'Henley Keifer - Patel\n\nLeo Keifer - Purcell\nJosephine Keifer - Caroline',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'G8EDG',
    ]);
    const [record] = parseCheddarUpExport(`${HEADER}\n${row}`);

    expect(record.childLines).toEqual([
      'Henley Keifer - Patel',
      'Leo Keifer - Purcell',
      'Josephine Keifer - Caroline',
    ]);
    expect(record.additional).toBeNull();
  });

  it('skips a row with no primary first or last name', () => {
    const blankRow = csvRow(Array.from({length: 23}, () => ''));
    expect(parseCheddarUpExport(`${HEADER}\n${blankRow}`)).toEqual([]);
  });

  it('throws when the header has the wrong number of columns', () => {
    expect(() => parseCheddarUpExport('a,b,c\n1,2,3')).toThrow(MembershipImportError);
  });

  it('throws when a header column name does not match', () => {
    const badHeader = HEADER.replace('Respondent', 'Something Else');
    expect(() => parseCheddarUpExport(`${badHeader}\n`)).toThrow(/Unexpected column 1/);
  });

  it('throws MembershipImportError when the CSV parser itself reports an error', async () => {
    vi.resetModules();
    vi.doMock('papaparse', () => ({
      default: {parse: () => ({data: [], errors: [{message: 'boom'}]})},
    }));
    const {parseCheddarUpExport: parseWithMockedPapa} = await import('../parse');
    expect(() => parseWithMockedPapa('irrelevant')).toThrow(/Could not parse CSV: boom/);
    vi.doUnmock('papaparse');
    vi.resetModules();
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `pnpm vitest run app/lib/membership/__tests__/parse.test.ts`
Expected: FAIL — `../parse` cannot be found.

- [ ] **Step 6: Write `parse.ts`**

```typescript
import Papa from 'papaparse';
import {MembershipImportError} from './errors';
import type {PersonFields, RawFamilySubmission} from './types';

const EXPECTED_HEADER = [
  'Respondent',
  'Email',
  'Date',
  'Your first name',
  'Your last name',
  'Your email address',
  'Your street address',
  'City',
  'State/Province',
  'Zip/Postal Code',
  'Street Address, Line 2',
  'Your phone number',
  'Child name(s), grade(s), homeroom teacher(s) — one line per child please',
  'Additional parent first name',
  'Additional parent last name',
  'Additional parent email',
  'Additional parent phone number',
  'City',
  'State/Province',
  'Zip/Postal Code',
  'Additional parent street address (leave blank if the same)',
  'Street Address, Line 2',
  'Document Number',
] as const;

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export function parseCheddarUpExport(csvText: string): RawFamilySubmission[] {
  const parsed = Papa.parse<string[]>(stripBom(csvText), {skipEmptyLines: true});
  if (parsed.errors.length > 0) {
    throw new MembershipImportError(`Could not parse CSV: ${parsed.errors[0].message}`);
  }

  const [header, ...dataRows] = parsed.data;
  if (!header || header.length !== EXPECTED_HEADER.length) {
    throw new MembershipImportError(
      `Expected ${EXPECTED_HEADER.length} columns, found ${header?.length ?? 0}. The Cheddar Up export format may have changed.`,
    );
  }
  EXPECTED_HEADER.forEach((expected, index) => {
    if (header[index] !== expected) {
      throw new MembershipImportError(
        `Unexpected column ${index + 1}: expected "${expected}", found "${header[index]}". The Cheddar Up export format may have changed.`,
      );
    }
  });

  const records: RawFamilySubmission[] = [];
  for (const row of dataRows) {
    if (row.every((cell) => cell.trim() === '')) continue;

    const col = (index: number) => (row[index] ?? '').trim();

    const primary: PersonFields = {
      city: col(7),
      email: col(5),
      firstName: col(3),
      lastName: col(4),
      phone: col(11),
      state: col(8),
      street: col(6),
      streetLine2: col(10),
      zip: col(9),
    };
    if (!primary.firstName && !primary.lastName) continue;

    const additionalFirstName = col(13);
    const additionalStreetGiven = col(20) !== '';
    const additional: PersonFields | null = additionalFirstName
      ? {
          city: col(17),
          email: col(15),
          firstName: additionalFirstName,
          lastName: col(14),
          phone: col(16),
          state: col(18),
          street: col(20),
          streetLine2: col(21),
          zip: col(19),
        }
      : null;

    const childLines = col(12)
      .split('\n')
      .map((line) => line.trim().replace(/^,+|,+$/g, ''))
      .filter((line) => line !== '');

    records.push({
      additional,
      additionalStreetGiven,
      childLines,
      documentNumber: col(22),
      paidDate: col(2),
      primary,
    });
  }

  return records;
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `pnpm vitest run app/lib/membership/__tests__/parse.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 8: Lint and commit**

```bash
pnpm lint:fix
git add package.json pnpm-lock.yaml app/lib/membership/types.ts app/lib/membership/errors.ts app/lib/membership/parse.ts app/lib/membership/__tests__/parse.test.ts
git commit -m "Parse the Cheddar Up membership export"
```

---

### Task 4: Collapse duplicate submissions within one upload

**Files:**
- Create: `app/lib/membership/dedupe.ts`
- Test: `app/lib/membership/__tests__/dedupe.test.ts`

**Interfaces:**
- Consumes: `RawFamilySubmission`, `PersonFields` from `types.ts` (Task 3).
- Produces: `clusterDuplicateSubmissions(records: RawFamilySubmission[]):
  RawFamilySubmission[]` from `dedupe.ts`.

- [ ] **Step 1: Write the failing test**

```typescript
import {describe, expect, it} from 'vitest';
import {clusterDuplicateSubmissions} from '../dedupe';
import type {PersonFields, RawFamilySubmission} from '../types';

function person(overrides: Partial<PersonFields> = {}): PersonFields {
  return {
    city: '',
    email: '',
    firstName: 'First',
    lastName: 'Last',
    phone: '',
    state: '',
    street: '',
    streetLine2: '',
    zip: '',
    ...overrides,
  };
}

function submission(overrides: Partial<RawFamilySubmission> = {}): RawFamilySubmission {
  return {
    additional: null,
    additionalStreetGiven: false,
    childLines: [],
    documentNumber: 'DOC',
    paidDate: '09/01/2026',
    primary: person(),
    ...overrides,
  };
}

describe('clusterDuplicateSubmissions', () => {
  it('keeps unrelated families as separate rows', () => {
    const a = submission({primary: person({email: 'a@example.com', street: '1 First St'})});
    const b = submission({primary: person({email: 'b@example.com', street: '2 Second St'})});
    expect(clusterDuplicateSubmissions([a, b])).toEqual([a, b]);
  });

  it('collapses two submissions at the same address, keeping the later one', () => {
    const older = submission({
      documentNumber: 'OLD',
      paidDate: '06/19/2026',
      primary: person({email: 'franklin@example.com', firstName: 'Franklin', street: '1 Same St'}),
    });
    const newer = submission({
      documentNumber: 'NEW',
      paidDate: '09/08/2026',
      primary: person({email: 'erin@example.com', firstName: 'Erin', street: '1 Same St'}),
    });
    expect(clusterDuplicateSubmissions([older, newer])).toEqual([newer]);
  });

  it('collapses two submissions that share a parent email even with different addresses', () => {
    const older = submission({
      additional: person({email: 'shared@example.com', firstName: 'Mehrang'}),
      documentNumber: 'OLD',
      paidDate: '06/18/2026',
      primary: person({email: 'lindsay-old@example.com', street: '1 A St'}),
    });
    const newer = submission({
      additional: person({email: '', firstName: 'Mehrang'}),
      documentNumber: 'NEW',
      paidDate: '09/05/2026',
      primary: person({email: 'shared@example.com', street: '1 A St'}),
    });
    // These are the same household even though the specific matching field
    // (shared@example.com) appears as the additional parent's email in one
    // submission and the primary parent's email in the other.
    const swapped = submission({
      additional: person({email: 'shared@example.com', firstName: 'X'}),
      documentNumber: 'DIFFERENT-HOUSEHOLD',
      paidDate: '01/01/2026',
      primary: person({email: 'unrelated@example.com', street: '999 Nowhere'}),
    });
    expect(clusterDuplicateSubmissions([older, newer])).toEqual([newer]);
    expect(clusterDuplicateSubmissions([older, swapped])).toHaveLength(1);
  });

  it('breaks a same-day tie by keeping the more complete submission', () => {
    const sparse = submission({
      documentNumber: 'SPARSE',
      paidDate: '06/19/2026',
      primary: person({email: 'amanda@example.com', street: '1 Rock Terrace Dr'}),
    });
    const fuller = submission({
      additional: person({firstName: 'Julia', lastName: 'Cartwright'}),
      childLines: ['Theo Cartwright grade 5'],
      documentNumber: 'FULLER',
      paidDate: '06/19/2026',
      primary: person({email: 'amanda@example.com', street: '1 Rock Terrace Dr'}),
    });
    expect(clusterDuplicateSubmissions([sparse, fuller])).toEqual([fuller]);
  });

  it('normalizes street-suffix abbreviations before matching addresses', () => {
    const withAbbreviation = submission({
      documentNumber: 'A',
      paidDate: '06/18/2026',
      primary: person({email: 'liz@example.com', street: '2517 Mountain View Dr'}),
    });
    const withFullWord = submission({
      documentNumber: 'B',
      paidDate: '08/31/2026',
      primary: person({email: 'liz@example.com', street: '2517 Mountain View Drive'}),
    });
    expect(clusterDuplicateSubmissions([withAbbreviation, withFullWord])).toEqual([withFullWord]);
  });

  it('does not merge two records that both have a blank address and no emails', () => {
    const a = submission({primary: person({firstName: 'Alice'})});
    const b = submission({primary: person({firstName: 'Bob'})});
    expect(clusterDuplicateSubmissions([a, b])).toEqual([a, b]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run app/lib/membership/__tests__/dedupe.test.ts`
Expected: FAIL — `../dedupe` cannot be found.

- [ ] **Step 3: Write `dedupe.ts`**

```typescript
import type {PersonFields, RawFamilySubmission} from './types';

const STREET_ABBREVIATIONS: Record<string, string> = {
  avenue: 'ave',
  boulevard: 'blvd',
  circle: 'cir',
  court: 'ct',
  cove: 'cv',
  drive: 'dr',
  highway: 'hwy',
  lane: 'ln',
  parkway: 'pkwy',
  place: 'pl',
  road: 'rd',
  skyway: 'skwy',
  street: 'st',
  terrace: 'ter',
  trail: 'trl',
};

function normalizeAddress(street: string): string {
  const cleaned = street
    .trim()
    .toLowerCase()
    .replace(/[.,#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  return cleaned
    .split(' ')
    .map((word) => STREET_ABBREVIATIONS[word] ?? word)
    .join(' ');
}

function familyKeyFields(record: RawFamilySubmission): {address: string; emails: string[]} {
  const emails = [record.primary.email, record.additional?.email ?? '']
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email !== '');
  return {address: normalizeAddress(record.primary.street), emails};
}

function personFieldCount(person: PersonFields | null): number {
  if (!person) return 0;
  return Object.values(person).filter((value) => value !== '').length;
}

function completeness(record: RawFamilySubmission): number {
  return (
    personFieldCount(record.primary) +
    personFieldCount(record.additional) +
    record.childLines.length +
    (record.documentNumber ? 1 : 0)
  );
}

function parseSubmissionDate(paidDate: string): number {
  const match = paidDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return Number.NEGATIVE_INFINITY;
  const [, month, day, year] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day));
}

function isBetterSubmission(candidate: RawFamilySubmission, current: RawFamilySubmission): boolean {
  const candidateDate = parseSubmissionDate(candidate.paidDate);
  const currentDate = parseSubmissionDate(current.paidDate);
  if (candidateDate !== currentDate) return candidateDate > currentDate;
  return completeness(candidate) > completeness(current);
}

export function clusterDuplicateSubmissions(
  records: RawFamilySubmission[],
): RawFamilySubmission[] {
  const parent = records.map((_, index) => index);

  function find(index: number): number {
    let root = index;
    while (parent[root] !== root) root = parent[root];
    parent[index] = root;
    return root;
  }

  function union(a: number, b: number): void {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent[rootA] = rootB;
  }

  const firstSeenByAddress = new Map<string, number>();
  const firstSeenByEmail = new Map<string, number>();

  records.forEach((record, index) => {
    const {address, emails} = familyKeyFields(record);
    if (address) {
      const seenAt = firstSeenByAddress.get(address);
      if (seenAt === undefined) firstSeenByAddress.set(address, index);
      else union(index, seenAt);
    }
    for (const email of emails) {
      const seenAt = firstSeenByEmail.get(email);
      if (seenAt === undefined) firstSeenByEmail.set(email, index);
      else union(index, seenAt);
    }
  });

  const clusters = new Map<number, number[]>();
  records.forEach((_, index) => {
    const root = find(index);
    const members = clusters.get(root) ?? [];
    members.push(index);
    clusters.set(root, members);
  });

  return [...clusters.values()].map((indexes) =>
    indexes.reduce((bestIndex, candidateIndex) =>
      isBetterSubmission(records[candidateIndex], records[bestIndex]) ? candidateIndex : bestIndex,
    ),
  ).map((bestIndex) => records[bestIndex]);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run app/lib/membership/__tests__/dedupe.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Lint and commit**

```bash
pnpm lint:fix
git add app/lib/membership/dedupe.ts app/lib/membership/__tests__/dedupe.test.ts
git commit -m "Collapse duplicate membership-form submissions within one upload"
```

---

### Task 5: Build per-person rows from families

**Files:**
- Create: `app/lib/membership/build-rows.ts`
- Test: `app/lib/membership/__tests__/build-rows.test.ts`

**Interfaces:**
- Consumes: `MemberRow`, `MemberRole` (Task 2); `PersonFields`, `RawFamilySubmission`
  (Task 3).
- Produces: `BuildMemberRowsResult` (fields: `rows: MemberRow[], skippedChildLines:
  {familyName: string; line: string}[]`); `buildMemberRows(records:
  RawFamilySubmission[], schoolYearStartsOn: string): BuildMemberRowsResult` from
  `build-rows.ts`. `schoolYearStartsOn` is `YYYY-MM-DD` (as stored in
  `school_years.starts_on`).

- [ ] **Step 1: Write the failing test**

```typescript
import {describe, expect, it} from 'vitest';
import {buildMemberRows} from '../build-rows';
import type {PersonFields, RawFamilySubmission} from '../types';

function person(overrides: Partial<PersonFields> = {}): PersonFields {
  return {
    city: '',
    email: '',
    firstName: 'First',
    lastName: 'Last',
    phone: '',
    state: '',
    street: '',
    streetLine2: '',
    zip: '',
    ...overrides,
  };
}

function submission(overrides: Partial<RawFamilySubmission> = {}): RawFamilySubmission {
  return {
    additional: null,
    additionalStreetGiven: false,
    childLines: [],
    documentNumber: 'DOC1',
    paidDate: '09/08/2026',
    primary: person({email: 'primary@example.com', firstName: 'Pat', lastName: 'Primary'}),
    ...overrides,
  };
}

const STARTS_ON = '2026-08-01';

describe('buildMemberRows', () => {
  it('emits one row for a primary-only family, with default city/state/zip', () => {
    const {rows, skippedChildLines} = buildMemberRows([submission()], STARTS_ON);
    expect(skippedChildLines).toEqual([]);
    expect(rows).toEqual([
      {
        address: '',
        cellPhone: '',
        city: 'Austin',
        email: 'primary@example.com',
        firstName: 'Pat',
        homePhone: '',
        lastName: 'Primary',
        lifetime: false,
        middleName: '',
        paidDate: '09/08/2026',
        role: 'primary',
        sourceDocumentNumber: 'DOC1',
        state: 'Texas',
        zip: '78704',
      },
    ]);
  });

  it('normalizes a TX state abbreviation to Texas', () => {
    const {rows} = buildMemberRows(
      [submission({primary: person({email: 'p@example.com', state: 'TX'})})],
      STARTS_ON,
    );
    expect(rows[0].state).toBe('Texas');
  });

  it('joins street + line 2 with a comma when line 2 is present', () => {
    const {rows} = buildMemberRows(
      [submission({primary: person({email: 'p@example.com', street: '100 Main St', streetLine2: 'Apt 2'})})],
      STARTS_ON,
    );
    expect(rows[0].address).toBe('100 Main St, Apt 2');
  });

  it('gives the spouse a plus-addressed email and the household phone/address when they gave none', () => {
    const record = submission({
      additional: person({firstName: 'Sam', lastName: 'Spouse'}),
      primary: person({
        city: 'Austin',
        email: 'primary@example.com',
        firstName: 'Pat',
        lastName: 'Primary',
        phone: '+15125550000',
        state: 'TX',
        street: '1 Main St',
        zip: '78704',
      }),
    });
    const {rows} = buildMemberRows([record], STARTS_ON);
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({
      address: '1 Main St',
      cellPhone: '+15125550000',
      city: 'Austin',
      email: 'primary+sam@example.com',
      firstName: 'Sam',
      lastName: 'Spouse',
      role: 'spouse',
      state: 'Texas',
    });
  });

  it('keeps the spouse own email/phone/address and does not backfill phone from the primary', () => {
    const record = submission({
      additional: person({
        city: 'Austin',
        email: 'sam@example.com',
        firstName: 'Sam',
        lastName: 'Spouse',
        phone: '',
        state: 'TX',
        street: '2 Own St',
        zip: '78704',
      }),
      additionalStreetGiven: true,
      primary: person({email: 'primary@example.com', firstName: 'Pat', lastName: 'Primary', phone: '+15125550000'}),
    });
    const {rows} = buildMemberRows([record], STARTS_ON);
    expect(rows[1]).toMatchObject({
      address: '2 Own St',
      cellPhone: '',
      email: 'sam@example.com',
    });
  });

  it('adds a child row per valid name line and skips a non-name line', () => {
    const record = submission({
      childLines: ['Everett Primary, 1st, Goodin', '3 BHE alumni'],
      primary: person({email: 'primary@example.com', firstName: 'Pat', lastName: 'Primary', phone: '+15125550000'}),
    });
    const {rows, skippedChildLines} = buildMemberRows([record], STARTS_ON);
    const childRows = rows.filter((row) => row.role === 'child');
    expect(childRows).toHaveLength(1);
    expect(childRows[0]).toMatchObject({
      cellPhone: '+15125550000',
      email: 'primary+everett@example.com',
      firstName: 'Everett',
      lastName: 'Primary',
    });
    expect(skippedChildLines).toEqual([{familyName: 'Pat Primary', line: '3 BHE alumni'}]);
  });

  it('clamps a PaidDate before the school year start up to the start date', () => {
    const {rows} = buildMemberRows(
      [submission({paidDate: '06/19/2026', primary: person({email: 'p@example.com'})})],
      STARTS_ON,
    );
    expect(rows[0].paidDate).toBe('08/01/2026');
  });

  it('leaves a PaidDate on or after the school year start unchanged', () => {
    const {rows} = buildMemberRows(
      [submission({paidDate: '09/08/2026', primary: person({email: 'p@example.com'})})],
      STARTS_ON,
    );
    expect(rows[0].paidDate).toBe('09/08/2026');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run app/lib/membership/__tests__/build-rows.test.ts`
Expected: FAIL — `../build-rows` cannot be found.

- [ ] **Step 3: Write `build-rows.ts`**

```typescript
import type {MemberRole, MemberRow, PersonFields, RawFamilySubmission} from './types';

const DEFAULT_CITY = 'Austin';
const DEFAULT_STATE = 'Texas';
const DEFAULT_ZIP = '78704';

const STATE_NAMES: Record<string, string> = {
  TEXAS: 'Texas',
  TX: 'Texas',
};

function normalizeState(state: string): string {
  const trimmed = state.trim();
  if (!trimmed) return DEFAULT_STATE;
  return STATE_NAMES[trimmed.toUpperCase()] ?? trimmed;
}

function resolveAddress(person: PersonFields): {
  address: string;
  city: string;
  state: string;
  zip: string;
} {
  const address = person.streetLine2.trim()
    ? `${person.street.trim()}, ${person.streetLine2.trim()}`
    : person.street.trim();
  return {
    address,
    city: person.city.trim() || DEFAULT_CITY,
    state: normalizeState(person.state),
    zip: person.zip.trim() || DEFAULT_ZIP,
  };
}

function plusAddress(email: string, firstName: string): string {
  const trimmedEmail = email.trim();
  const atIndex = trimmedEmail.indexOf('@');
  if (atIndex === -1 || !firstName) return trimmedEmail;
  const local = trimmedEmail.slice(0, atIndex);
  const domain = trimmedEmail.slice(atIndex + 1);
  return `${local}+${firstName.trim().toLowerCase()}@${domain}`;
}

function firstNameFromChildLine(line: string): string | null {
  const namePart = line.split(/[,-]/, 1)[0] ?? '';
  const firstWord = namePart.trim().split(/\s+/)[0] ?? '';
  return /^[A-Za-z]+$/.test(firstWord) ? firstWord : null;
}

function clampPaidDate(paidDate: string, floorIso: string): string {
  const [month, day, year] = paidDate.split('/').map(Number);
  const original = Date.UTC(year, month - 1, day);
  const [floorYear, floorMonth, floorDay] = floorIso.split('-').map(Number);
  const floor = Date.UTC(floorYear, floorMonth - 1, floorDay);
  if (original >= floor) return paidDate;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(floorMonth)}/${pad(floorDay)}/${floorYear}`;
}

function buildRow(
  role: MemberRole,
  person: PersonFields,
  email: string,
  paidDate: string,
  sourceDocumentNumber: string,
): MemberRow {
  const {address, city, state, zip} = resolveAddress(person);
  return {
    address,
    cellPhone: person.phone.trim(),
    city,
    email,
    firstName: person.firstName.trim(),
    homePhone: '',
    lastName: person.lastName.trim(),
    lifetime: false,
    middleName: '',
    paidDate,
    role,
    sourceDocumentNumber,
    state,
    zip,
  };
}

export interface BuildMemberRowsResult {
  rows: MemberRow[];
  skippedChildLines: {familyName: string; line: string}[];
}

export function buildMemberRows(
  records: RawFamilySubmission[],
  schoolYearStartsOn: string,
): BuildMemberRowsResult {
  const rows: MemberRow[] = [];
  const skippedChildLines: {familyName: string; line: string}[] = [];

  for (const record of records) {
    const paidDate = clampPaidDate(record.paidDate, schoolYearStartsOn);
    const primaryEmail = record.primary.email.trim();

    rows.push(buildRow('primary', record.primary, primaryEmail, paidDate, record.documentNumber));

    if (record.additional) {
      const additional = record.additional;
      const household: PersonFields = record.additionalStreetGiven
        ? additional
        : {
            ...additional,
            city: record.primary.city,
            state: record.primary.state,
            street: record.primary.street,
            streetLine2: record.primary.streetLine2,
            zip: record.primary.zip,
          };
      const phone =
        household.phone.trim() || (record.additionalStreetGiven ? '' : record.primary.phone.trim());
      const email = additional.email.trim() || plusAddress(primaryEmail, additional.firstName);

      rows.push(
        buildRow('spouse', {...household, phone}, email, paidDate, record.documentNumber),
      );
    }

    for (const line of record.childLines) {
      const childFirstName = firstNameFromChildLine(line);
      if (!childFirstName) {
        skippedChildLines.push({
          familyName: `${record.primary.firstName} ${record.primary.lastName}`.trim(),
          line,
        });
        continue;
      }
      const childPerson: PersonFields = {...record.primary, firstName: childFirstName};
      rows.push(
        buildRow(
          'child',
          childPerson,
          plusAddress(primaryEmail, childFirstName),
          paidDate,
          record.documentNumber,
        ),
      );
    }
  }

  return {rows, skippedChildLines};
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run app/lib/membership/__tests__/build-rows.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Lint and commit**

```bash
pnpm lint:fix
git add app/lib/membership/build-rows.ts app/lib/membership/__tests__/build-rows.test.ts
git commit -m "Build primary/spouse/child rows from clustered submissions"
```

---

### Task 6: The API route

**Files:**
- Modify: `app/routes.ts`
- Create: `app/routes/api.admin.membership-import.ts`
- Test: `app/routes/__tests__/api.admin.membership-import.test.ts`

**Interfaces:**
- Consumes: `parseCheddarUpExport` (Task 3), `clusterDuplicateSubmissions` (Task 4),
  `buildMemberRows` (Task 5), `toImportCsv` (Task 2), `MembershipImportError` (Task 3),
  `MemberRow` (Task 2), `requireAdmin` from `~/lib/admin/auth`, `getCloudflare` from
  `~/lib/cloudflare-context` — all existing/prior-task exports, unchanged signatures.
- Produces: the route `POST /api/admin/membership/import`, consumed by Task 7's page.

- [ ] **Step 1: Register the route**

In `app/routes.ts`, add these two lines directly after the existing
`route('admin/school-years', ...)` line:

```typescript
  route('admin/membership', './routes/admin.membership.tsx'),
  route('api/admin/membership/import', './routes/api.admin.membership-import.ts'),
```

- [ ] **Step 2: Write the failing test**

```typescript
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('~/lib/admin/auth', () => ({
  requireAdmin: vi.fn(async () => ({email: 'admin@example.com', name: 'Admin'})),
}));

import {createTestLoadContext} from '~/lib/test-cloudflare-context';
import {action} from '../api.admin.membership-import';

const HEADER = [
  'Respondent',
  'Email',
  'Date',
  'Your first name',
  'Your last name',
  'Your email address',
  'Your street address',
  'City',
  'State/Province',
  'Zip/Postal Code',
  'Street Address, Line 2',
  'Your phone number',
  'Child name(s), grade(s), homeroom teacher(s) — one line per child please',
  'Additional parent first name',
  'Additional parent last name',
  'Additional parent email',
  'Additional parent phone number',
  'City',
  'State/Province',
  'Zip/Postal Code',
  'Additional parent street address (leave blank if the same)',
  'Street Address, Line 2',
  'Document Number',
].join(',');

function familyRow(firstName: string, email: string): string {
  return [
    `${firstName} Example`,
    email,
    '09/08/2026',
    firstName,
    'Example',
    email,
    '1 Main St',
    'Austin',
    'TX',
    '78704',
    '',
    '+15125550000',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    `DOC-${firstName}`,
  ].join(',');
}

function createDb(existingEmails: string[]) {
  const inserted: unknown[][] = [];
  const prepare = vi.fn((sql: string) => {
    if (sql.includes('FROM school_years')) {
      return {bind: () => ({first: async () => ({id: '2026-27', starts_on: '2026-08-01'})})};
    }
    if (sql.includes('FROM pta_members')) {
      return {
        bind: () => ({all: async () => ({results: existingEmails.map((email) => ({email}))})}),
      };
    }
    return {
      bind: (...args: unknown[]) => {
        inserted.push(args);
        return {};
      },
    };
  });
  return {db: {batch: vi.fn(async () => []), prepare}, inserted};
}

function multipartRequest(csvText: string, schoolYearId = '2026-27'): Request {
  const body = new FormData();
  body.append('schoolYearId', schoolYearId);
  body.append('file', new File([csvText], 'export.csv', {type: 'text/csv'}));
  return new Request('https://example.com/api/admin/membership/import', {body, method: 'POST'});
}

describe('api.admin.membership-import action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports a new member and records them in pta_members', async () => {
    const csvText = `${HEADER}\n${familyRow('Pat', 'pat@example.com')}`;
    const {db, inserted} = createDb([]);

    const response = await action({
      request: multipartRequest(csvText),
      context: createTestLoadContext({ctx: {} as ExecutionContext, env: {REIMBURSEMENT_DB: db}}),
    } as never);

    expect(response.status).toBe(200);
    expect(response.headers.get('X-New-Count')).toBe('1');
    expect(response.headers.get('X-Already-Tracked-Count')).toBe('0');
    const csv = await response.text();
    expect(csv).toContain('pat@example.com');
    expect(inserted).toHaveLength(1);
  });

  it('excludes a member already tracked for the school year', async () => {
    const csvText = `${HEADER}\n${familyRow('Pat', 'pat@example.com')}`;
    const {db, inserted} = createDb(['pat@example.com']);

    const response = await action({
      request: multipartRequest(csvText),
      context: createTestLoadContext({ctx: {} as ExecutionContext, env: {REIMBURSEMENT_DB: db}}),
    } as never);

    expect(response.status).toBe(200);
    expect(response.headers.get('X-New-Count')).toBe('0');
    expect(response.headers.get('X-Already-Tracked-Count')).toBe('1');
    const csv = await response.text();
    expect(csv.split('\n')).toHaveLength(1);
    expect(inserted).toHaveLength(0);
  });

  it('returns 400 with the parser message when the export format is unrecognized', async () => {
    const {db} = createDb([]);

    const response = await action({
      request: multipartRequest('a,b,c\n1,2,3'),
      context: createTestLoadContext({ctx: {} as ExecutionContext, env: {REIMBURSEMENT_DB: db}}),
    } as never);

    expect(response.status).toBe(400);
    const body = (await response.json()) as {error: string};
    expect(body.error).toMatch(/columns/);
  });

  it('returns 400 when the school year is unknown', async () => {
    const {db} = createDb([]);
    db.prepare = vi.fn(() => ({bind: () => ({first: async () => null})})) as never;

    const response = await action({
      request: multipartRequest(`${HEADER}\n${familyRow('Pat', 'pat@example.com')}`),
      context: createTestLoadContext({ctx: {} as ExecutionContext, env: {REIMBURSEMENT_DB: db}}),
    } as never);

    expect(response.status).toBe(400);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm vitest run app/routes/__tests__/api.admin.membership-import.test.ts`
Expected: FAIL — `../api.admin.membership-import` cannot be found.

- [ ] **Step 4: Write `api.admin.membership-import.ts`**

```typescript
import {requireAdmin} from '~/lib/admin/auth';
import {getCloudflare} from '~/lib/cloudflare-context';
import {buildMemberRows} from '~/lib/membership/build-rows';
import {toImportCsv} from '~/lib/membership/csv-output';
import {clusterDuplicateSubmissions} from '~/lib/membership/dedupe';
import {MembershipImportError} from '~/lib/membership/errors';
import {parseCheddarUpExport} from '~/lib/membership/parse';
import type {MemberRow} from '~/lib/membership/types';
import type {Route} from './+types/api.admin.membership-import';

interface SchoolYearRow {
  id: string;
  starts_on: string;
}

export async function action({request, context}: Route.ActionArgs) {
  const env = getCloudflare(context).env;
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const db = env.REIMBURSEMENT_DB;
  const formData = await request.formData();
  const schoolYearId = formData.get('schoolYearId');
  const file = formData.get('file');

  if (typeof schoolYearId !== 'string' || !schoolYearId) {
    return Response.json({error: 'schoolYearId is required'}, {status: 400});
  }
  if (!(file instanceof File)) {
    return Response.json({error: 'file is required'}, {status: 400});
  }

  const schoolYear = await db
    .prepare('SELECT id, starts_on FROM school_years WHERE id = ?')
    .bind(schoolYearId)
    .first<SchoolYearRow>();
  if (!schoolYear) {
    return Response.json({error: 'Unknown school year'}, {status: 400});
  }

  let built: {rows: MemberRow[]; skippedChildLines: {familyName: string; line: string}[]};
  try {
    const csvText = await file.text();
    const submissions = parseCheddarUpExport(csvText);
    const clustered = clusterDuplicateSubmissions(submissions);
    built = buildMemberRows(clustered, schoolYear.starts_on);
  } catch (error) {
    if (error instanceof MembershipImportError) {
      return Response.json({error: error.message}, {status: 400});
    }
    throw error;
  }

  const existing = await db
    .prepare('SELECT email FROM pta_members WHERE school_year_id = ?')
    .bind(schoolYearId)
    .all<{email: string}>();
  const alreadyTracked = new Set(existing.results.map((row) => row.email.toLowerCase()));

  const newRows: MemberRow[] = [];
  const seenThisUpload = new Set<string>();
  let alreadyTrackedCount = 0;
  let skippedDuplicateCount = 0;

  for (const row of built.rows) {
    const emailKey = row.email.toLowerCase();
    if (alreadyTracked.has(emailKey)) {
      alreadyTrackedCount += 1;
      continue;
    }
    if (seenThisUpload.has(emailKey)) {
      skippedDuplicateCount += 1;
      continue;
    }
    seenThisUpload.add(emailKey);
    newRows.push(row);
  }

  if (newRows.length > 0) {
    await db.batch(
      newRows.map((row) =>
        db
          .prepare(
            `INSERT INTO pta_members
              (id, school_year_id, role, email, first_name, middle_name, last_name, gender,
               address, city, state, zip, home_phone, cell_phone, lifetime, paid_date,
               source_document_number)
             VALUES (?, ?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            crypto.randomUUID(),
            schoolYearId,
            row.role,
            row.email.toLowerCase(),
            row.firstName,
            row.middleName,
            row.lastName,
            row.address,
            row.city,
            row.state,
            row.zip,
            row.homePhone,
            row.cellPhone,
            row.lifetime ? 1 : 0,
            row.paidDate,
            row.sourceDocumentNumber,
          ),
      ),
    );
  }

  const csv = toImportCsv(newRows);

  return new Response(csv, {
    headers: {
      'Content-Disposition': `attachment; filename="pta-import-${schoolYearId}-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Content-Type': 'text/csv',
      'X-Already-Tracked-Count': String(alreadyTrackedCount),
      'X-New-Count': String(newRows.length),
      'X-Skipped-Child-Lines': String(built.skippedChildLines.length),
      'X-Skipped-Duplicate-Count': String(skippedDuplicateCount),
    },
  });
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm vitest run app/routes/__tests__/api.admin.membership-import.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Type-check**

Run: `pnpm typecheck`
Expected: no errors (this regenerates route types for the new routes registered in Step 1,
which `api.admin.membership-import.ts` depends on via `./+types/api.admin.membership-import`).

- [ ] **Step 7: Lint and commit**

```bash
pnpm lint:fix
git add app/routes.ts app/routes/api.admin.membership-import.ts app/routes/__tests__/api.admin.membership-import.test.ts
git commit -m "Add the membership-import API route"
```

---

### Task 7: The admin page

**Files:**
- Create: `app/routes/admin.membership.tsx`
- Modify: `app/routes/admin.reimbursements.tsx` (add nav link)
- Modify: `app/routes/admin.school-years.tsx` (add nav link)

**Interfaces:**
- Consumes: `requireAdmin`, `SessionPayload` from `~/lib/admin/auth`; `getCloudflare` from
  `~/lib/cloudflare-context`; `mergeParentMeta` from `~/lib/meta`; posts to
  `POST /api/admin/membership/import` (Task 6), reading its `X-New-Count`,
  `X-Already-Tracked-Count`, `X-Skipped-Child-Lines`, `X-Skipped-Duplicate-Count` response
  headers and CSV body.

- [ ] **Step 1: Write `admin.membership.tsx`**

```tsx
import {useState} from 'react';
import {useLoaderData} from 'react-router';
import {requireAdmin, type SessionPayload} from '~/lib/admin/auth';
import {getCloudflare} from '~/lib/cloudflare-context';
import {mergeParentMeta} from '~/lib/meta';
import type {Route} from './+types/admin.membership';

export function meta({matches}: Route.MetaArgs) {
  return mergeParentMeta(matches, [{title: 'Membership import | Admin'}]);
}

interface SchoolYearOption {
  id: string;
  is_default: number;
  label: string;
}

export async function loader({request, context}: Route.LoaderArgs) {
  const env = getCloudflare(context).env;
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;
  const user: SessionPayload = auth;

  const db = env.REIMBURSEMENT_DB;
  const schoolYears = await db
    .prepare(
      'SELECT id, label, is_default FROM school_years ORDER BY sort_order DESC, starts_on DESC',
    )
    .all<SchoolYearOption>();

  return {schoolYears: schoolYears.results, user};
}

interface ImportSummary {
  alreadyTracked: number;
  newCount: number;
  skippedChildLines: number;
  skippedDuplicates: number;
}

export default function AdminMembership() {
  const {schoolYears, user} = useLoaderData<typeof loader>();
  const defaultYear = schoolYears.find((year) => year.is_default) ?? schoolYears[0];

  const [schoolYearId, setSchoolYearId] = useState(defaultYear?.id ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const handleSubmit = async () => {
    if (!file || !schoolYearId) {
      setError('Choose a school year and a file.');
      return;
    }
    setBusy(true);
    setError(null);
    setSummary(null);
    try {
      const body = new FormData();
      body.append('schoolYearId', schoolYearId);
      body.append('file', file);
      const res = await fetch('/api/admin/membership/import', {body, method: 'POST'});
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {error?: string};
        throw new Error(data.error || 'Import failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `pta-import-${schoolYearId}.csv`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      setSummary({
        alreadyTracked: Number(res.headers.get('X-Already-Tracked-Count') ?? 0),
        newCount: Number(res.headers.get('X-New-Count') ?? 0),
        skippedChildLines: Number(res.headers.get('X-Skipped-Child-Lines') ?? 0),
        skippedDuplicates: Number(res.headers.get('X-Skipped-Duplicate-Count') ?? 0),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-white">
      <header className="bg-gradient-to-r from-eagle-blue to-night-blue shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl md:text-2xl font-heading font-bold text-white">
            Membership import
          </h1>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <a
              className="text-sm font-body text-white/90 hover:text-white underline underline-offset-2 transition-colors"
              href="/admin/reimbursements"
            >
              Reimbursements
            </a>
            <a
              className="text-sm font-body text-white/90 hover:text-white underline underline-offset-2 transition-colors"
              href="/admin/school-years"
            >
              School years
            </a>
            <span className="text-sm text-white/80 hidden sm:inline">{user.name}</span>
            <a
              className="text-sm text-white/70 hover:text-white underline underline-offset-2 transition-colors"
              href="/api/auth/logout"
            >
              Logout
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <p className="text-sm text-gray-600 font-body max-w-2xl">
          Upload the Cheddar Up membership-form export. New members (not already exported
          this school year) come back as a Texas PTA import CSV, ready for MyPTEZ.
        </p>

        {error && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 font-body"
            role="alert"
          >
            {error}
          </div>
        )}

        {summary && (
          <div
            className="rounded-lg border border-creek-green/30 bg-creek-green/10 px-4 py-3 text-sm text-charcoal font-body"
            role="status"
          >
            {summary.newCount} new member{summary.newCount === 1 ? '' : 's'} exported.{' '}
            {summary.alreadyTracked} already tracked this year.
            {summary.skippedChildLines > 0 &&
              ` ${summary.skippedChildLines} child line(s) skipped (not a name).`}
            {summary.skippedDuplicates > 0 &&
              ` ${summary.skippedDuplicates} duplicate email(s) skipped within this upload.`}
          </div>
        )}

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4 text-sm font-body">
          <div>
            <label className="block font-medium text-charcoal mb-1" htmlFor="school-year">
              School year
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue"
              id="school-year"
              onChange={(e) => setSchoolYearId(e.target.value)}
              value={schoolYearId}
            >
              {schoolYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.label}
                  {year.is_default ? ' (default)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium text-charcoal mb-1" htmlFor="export-file">
              Cheddar Up export (.csv)
            </label>
            <input
              accept=".csv,text/csv"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-charcoal shadow-sm"
              id="export-file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              type="file"
            />
          </div>
          <button
            className="inline-flex items-center rounded-lg bg-eagle-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-eagle-blue/90 disabled:opacity-50 font-body"
            disabled={busy}
            onClick={handleSubmit}
            type="button"
          >
            {busy ? 'Generating…' : 'Generate import CSV'}
          </button>
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Add a "Membership" nav link to `admin.reimbursements.tsx`**

In `app/routes/admin.reimbursements.tsx`, in the header nav block (the one containing the
"School years" link), add a sibling link right before it:

```tsx
            <a
              className="text-sm font-body text-white/90 hover:text-white underline underline-offset-2 transition-colors"
              href="/admin/membership"
            >
              Membership
            </a>
```

- [ ] **Step 3: Add the same nav link to `admin.school-years.tsx`**

In `app/routes/admin.school-years.tsx`, in its header nav block (next to the existing
"Reimbursements" link), add:

```tsx
            <a
              className="text-sm font-body text-white/90 hover:text-white underline underline-offset-2 transition-colors"
              href="/admin/membership"
            >
              Membership
            </a>
```

- [ ] **Step 4: Type-check**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 5: Manual verification**

Run: `pnpm dev`, then:
1. Log in at `/admin/login`, visit `/admin/school-years`, and add a `2026-27` school year
   with `starts_on = 2026-08-01` if one doesn't already exist (mark it default).
2. Visit `/admin/membership`. Confirm the "Membership" links from `/admin/reimbursements`
   and `/admin/school-years` reach this page, and it links back to both.
3. Upload a real Cheddar Up export (e.g. `26-27/PTA_Membership_Information.csv` from the
   sibling membership project). Confirm a CSV downloads and the summary banner shows a
   new-member count.
4. Upload the same file again. Confirm the summary now shows 0 new members and the
   downloaded CSV is header-only.

- [ ] **Step 6: Lint and commit**

```bash
pnpm lint:fix
git add app/routes/admin.membership.tsx app/routes/admin.reimbursements.tsx app/routes/admin.school-years.tsx
git commit -m "Add the membership import admin page"
```
