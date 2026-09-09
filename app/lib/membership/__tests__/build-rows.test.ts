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
      [
        submission({
          primary: person({email: 'p@example.com', street: '100 Main St', streetLine2: 'Apt 2'}),
        }),
      ],
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
      primary: person({
        email: 'primary@example.com',
        firstName: 'Pat',
        lastName: 'Primary',
        phone: '+15125550000',
      }),
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
      primary: person({
        email: 'primary@example.com',
        firstName: 'Pat',
        lastName: 'Primary',
        phone: '+15125550000',
      }),
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

  it('keeps a hyphenated first name intact instead of truncating at the hyphen', () => {
    const record = submission({
      childLines: ['Jean-Paul Smith, 3rd, Goodin'],
      primary: person({
        email: 'primary@example.com',
        firstName: 'Pat',
        lastName: 'Primary',
      }),
    });
    const {rows, skippedChildLines} = buildMemberRows([record], STARTS_ON);
    const childRows = rows.filter((row) => row.role === 'child');
    expect(skippedChildLines).toEqual([]);
    expect(childRows).toHaveLength(1);
    expect(childRows[0]).toMatchObject({firstName: 'Jean-Paul'});
  });

  it('resolves each first name correctly across hyphen-as-delimiter, accented, and apostrophe child lines', () => {
    const record = submission({
      childLines: [
        'Elizabeth-5th',
        'Jean-Paul Smith, 3rd, Goodin',
        'Everett Hopkins, 1st, Goodin',
        '3 BHE alumni',
        'José Garcia, 2nd, Smith',
        "O'Brien Family, 1st, Jones",
      ],
      primary: person({
        email: 'primary@example.com',
        firstName: 'Pat',
        lastName: 'Primary',
      }),
    });
    const {rows, skippedChildLines} = buildMemberRows([record], STARTS_ON);
    const childFirstNames = rows.filter((row) => row.role === 'child').map((row) => row.firstName);
    expect(childFirstNames).toEqual(['Elizabeth', 'Jean-Paul', 'Everett', 'José', "O'Brien"]);
    expect(skippedChildLines).toEqual([{familyName: 'Pat Primary', line: '3 BHE alumni'}]);
  });

  it('uses the spouse own phone even when the spouse gave no street address', () => {
    const record = submission({
      additional: person({
        firstName: 'Sam',
        lastName: 'Spouse',
        phone: '+15125559999',
      }),
      additionalStreetGiven: false,
      primary: person({
        email: 'primary@example.com',
        firstName: 'Pat',
        lastName: 'Primary',
        phone: '+15125550000',
      }),
    });
    const {rows} = buildMemberRows([record], STARTS_ON);
    expect(rows[1]).toMatchObject({
      cellPhone: '+15125559999',
      role: 'spouse',
    });
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
