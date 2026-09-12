import {MembershipImportError} from './errors';
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

// A leading =, +, -, @, or tab can be interpreted as a formula by Excel/Sheets
// (CSV/DDE injection). Every field here comes from an untrusted, publicly
// submitted Cheddar Up form, so prefix a bare apostrophe to defuse it before
// the normal comma/quote/newline quoting below. Exempt plain numbers (e.g.
// CellPhone's +1E.164 format) -- a leading +/- on an otherwise-numeric value
// can't carry a formula payload, and MyPTEZ needs the phone number verbatim.
const DANGEROUS_LEADING_CHAR = /^[=+\-@\t]/;
const PLAIN_NUMBER = /^[+-]?\d+(\.\d+)?$/;

export function escapeCsvValue(value: string): string {
  const safe =
    DANGEROUS_LEADING_CHAR.test(value) && !PLAIN_NUMBER.test(value) ? `'${value}` : value;
  if (safe.includes(',') || safe.includes('"') || safe.includes('\n')) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function deriveMemberYear(paidDate: string): string {
  const match = paidDate.match(/\d{4}/);
  if (!match) {
    throw new MembershipImportError(`Cannot derive MemberYear from PaidDate "${paidDate}"`);
  }
  return match[0];
}

export function toImportCsv(rows: MemberRow[]): string {
  const lines = rows.map((row) => {
    const {
      address,
      cellPhone,
      city,
      email,
      firstName,
      homePhone,
      lastName,
      lifetime,
      middleName,
      paidDate,
      state,
      zip,
    } = row;
    return [
      deriveMemberYear(paidDate),
      '',
      firstName,
      middleName,
      lastName,
      '',
      email,
      address,
      city,
      state,
      zip,
      homePhone,
      cellPhone,
      lifetime ? 'TRUE' : 'FALSE',
      paidDate,
    ]
      .map(escapeCsvValue)
      .join(',');
  });
  return [IMPORT_CSV_COLUMNS.join(','), ...lines].join('\n');
}
