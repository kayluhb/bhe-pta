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
    const additionalLastName = col(14);
    const additionalStreetGiven = col(20) !== '';
    const additional: PersonFields | null =
      additionalFirstName || additionalLastName
        ? {
            city: col(17),
            email: col(15),
            firstName: additionalFirstName,
            lastName: additionalLastName,
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
