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
      primary: person({email: 'shared@example.com', street: '2 B St'}),
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

  it('merges a 3-record cluster linked transitively across email and address', () => {
    // a-b share an email but have different addresses; b-c share an address
    // but have different emails; a and c share nothing directly. All three
    // must still land in one cluster via b, and the record with the latest
    // paidDate (a) wins the tie-break outright.
    const a = submission({
      documentNumber: 'A',
      paidDate: '09/07/2026',
      primary: person({email: 'ab@example.com', street: '1 First St'}),
    });
    const b = submission({
      documentNumber: 'B',
      paidDate: '07/01/2026',
      primary: person({email: 'ab@example.com', street: '2 Second St'}),
    });
    const c = submission({
      documentNumber: 'C',
      paidDate: '05/01/2026',
      primary: person({email: 'other@example.com', street: '2 Second St'}),
    });
    const result = clusterDuplicateSubmissions([a, b, c]);
    expect(result).toHaveLength(1);
    expect(result).toEqual([a]);
  });

  it('treats an unparseable paidDate as older than any valid date', () => {
    const badDate = submission({
      documentNumber: 'BAD',
      paidDate: 'not-a-date',
      primary: person({email: 'x@example.com', street: '1 X St'}),
    });
    const validDate = submission({
      documentNumber: 'VALID',
      paidDate: '06/01/2026',
      primary: person({email: 'x@example.com', street: '1 X St'}),
    });
    expect(clusterDuplicateSubmissions([badDate, validDate])).toEqual([validDate]);
  });

  it('breaks a same-date tie in favor of the record with a documentNumber', () => {
    const noDocNumber = submission({
      documentNumber: '',
      paidDate: '06/01/2026',
      primary: person({email: 'y@example.com', street: '1 Y St'}),
    });
    const hasDocNumber = submission({
      documentNumber: 'HASDOC',
      paidDate: '06/01/2026',
      primary: person({email: 'y@example.com', street: '1 Y St'}),
    });
    expect(clusterDuplicateSubmissions([noDocNumber, hasDocNumber])).toEqual([hasDocNumber]);
  });
});
