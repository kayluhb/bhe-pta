export type MemberRole = 'primary' | 'spouse' | 'child';

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
