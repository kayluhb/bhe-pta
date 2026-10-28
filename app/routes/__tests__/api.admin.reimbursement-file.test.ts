import {describe, expect, it} from 'vitest';

import {isAllowedAdminReimbursementR2Key} from '../api.admin.reimbursement-file';

describe('isAllowedAdminReimbursementR2Key', () => {
  it('allows uploads, submissions, and budgets prefixes', () => {
    expect(isAllowedAdminReimbursementR2Key('uploads/foo')).toBe(true);
    expect(isAllowedAdminReimbursementR2Key('submissions/x')).toBe(true);
    expect(isAllowedAdminReimbursementR2Key('budgets/y')).toBe(true);
  });

  it('rejects traversal, missing slash, and unknown prefixes', () => {
    expect(isAllowedAdminReimbursementR2Key('uploads/../secret')).toBe(false);
    expect(isAllowedAdminReimbursementR2Key('uploads')).toBe(false);
    expect(isAllowedAdminReimbursementR2Key('/uploads/foo')).toBe(false);
    expect(isAllowedAdminReimbursementR2Key('budgets\\y')).toBe(false);
    expect(isAllowedAdminReimbursementR2Key('other/foo')).toBe(false);
    expect(isAllowedAdminReimbursementR2Key('')).toBe(false);
  });
});
