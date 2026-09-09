export class MembershipImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MembershipImportError';
  }
}
