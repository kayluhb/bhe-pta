export type MemberRole = 'primary' | 'spouse' | 'child';

export interface PersonFields {
  city: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  state: string;
  street: string;
  streetLine2: string;
  zip: string;
}

export interface RawFamilySubmission {
  additional: PersonFields | null;
  additionalStreetGiven: boolean;
  childLines: string[];
  documentNumber: string;
  paidDate: string;
  primary: PersonFields;
}

export interface MemberRow {
  address: string;
  cellPhone: string;
  city: string;
  email: string;
  firstName: string;
  homePhone: string;
  lastName: string;
  lifetime: boolean;
  middleName: string;
  paidDate: string;
  role: MemberRole;
  sourceDocumentNumber: string;
  state: string;
  zip: string;
}
