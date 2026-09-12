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
  const namePart = line.split(/,/, 1)[0] ?? '';
  const firstWord = namePart.trim().split(/\s+/)[0] ?? '';
  const match = firstWord.match(/^[A-Za-zÀ-ſ']+(?:-[A-Za-zÀ-ſ']+)*/);
  return match ? match[0] : null;
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
      const {city, state, street, streetLine2, zip} = record.primary;
      const household: PersonFields = record.additionalStreetGiven
        ? additional
        : {...additional, city, state, street, streetLine2, zip};
      const phone =
        household.phone.trim() || (record.additionalStreetGiven ? '' : record.primary.phone.trim());
      const email = additional.email.trim() || plusAddress(primaryEmail, additional.firstName);

      rows.push(buildRow('spouse', {...household, phone}, email, paidDate, record.documentNumber));
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
