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
