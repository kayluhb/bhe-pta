import {describe, expect, it, vi} from 'vitest';
import {MembershipImportError} from '../errors';
import {parseCheddarUpExport} from '../parse';

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
    const withBom = `﻿${HEADER}\n${row}`;
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
