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

  it('defuses a value that would be interpreted as a formula by Excel/Sheets', () => {
    expect(escapeCsvValue('=HYPERLINK("http://evil","x")')).toBe(
      '"\'=HYPERLINK(""http://evil"",""x"")"',
    );
    expect(escapeCsvValue('@SUM(A1,A2)')).toBe('"\'@SUM(A1,A2)"');
    expect(escapeCsvValue("-2+cmd|'/c calc'")).toBe("'-2+cmd|'/c calc'");
    expect(escapeCsvValue('\tsneaky')).toBe("'\tsneaky");
  });

  it('does not defuse a plain phone-number-shaped value starting with + or -', () => {
    expect(escapeCsvValue('+15125551234')).toBe('+15125551234');
    expect(escapeCsvValue('-42')).toBe('-42');
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
