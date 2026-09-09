import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('~/lib/admin/auth', () => ({
  requireAdmin: vi.fn(async () => ({email: 'admin@example.com', name: 'Admin'})),
}));

import {createTestLoadContext} from '~/lib/test-cloudflare-context';
import {action} from '../api.admin.membership-import';

function csvRow(cells: string[]): string {
  return cells
    .map((cell) => (cell.includes(',') || cell.includes('\n') ? `"${cell}"` : cell))
    .join(',');
}

const HEADER = csvRow([
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
]);

function familyRow(firstName: string, email: string): string {
  return csvRow([
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
  ]);
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
