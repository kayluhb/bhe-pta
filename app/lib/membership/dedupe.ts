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
  const cleaned = street.trim().toLowerCase().replace(/[.,#]/g, ' ').replace(/\s+/g, ' ').trim();
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

export function clusterDuplicateSubmissions(records: RawFamilySubmission[]): RawFamilySubmission[] {
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

  return [...clusters.values()]
    .map((indexes) =>
      indexes.reduce((bestIndex, candidateIndex) =>
        isBetterSubmission(records[candidateIndex], records[bestIndex])
          ? candidateIndex
          : bestIndex,
      ),
    )
    .map((bestIndex) => records[bestIndex]);
}
