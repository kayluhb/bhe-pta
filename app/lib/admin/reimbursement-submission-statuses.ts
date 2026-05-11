/** Values stored in `submissions.status` for the reimbursement admin workflow. */
export const ADMIN_SUBMISSION_STATUSES = [
  'pending',
  'approved',
  'check_written',
  'check_delivered',
  'check_deposited',
  'rejected',
] as const;

export type AdminSubmissionStatus = (typeof ADMIN_SUBMISSION_STATUSES)[number];

export const ADMIN_SUBMISSION_STATUS_LABELS: Record<AdminSubmissionStatus, string> = {
  approved: 'Approved',
  check_delivered: 'Check Delivered',
  check_deposited: 'Check Deposited',
  check_written: 'Check Written',
  pending: 'Pending',
  rejected: 'Rejected',
};

export function isAdminSubmissionStatus(value: string): value is AdminSubmissionStatus {
  return (ADMIN_SUBMISSION_STATUSES as readonly string[]).includes(value);
}
