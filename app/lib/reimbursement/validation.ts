import {z} from 'zod';

import {isValidStagingUploadKey} from '~/lib/reimbursement/r2-staging';

export const BUDGET_ACCOUNTS = [
  'Academic enrichment',
  'ACPTA Mini-grants & Austin Ed grants',
  'Admin — Accounting (Quickbooks Online)',
  'Admin — ACPTA dues',
  'Admin — Bank & credit card fees',
  'Admin — Google Drive',
  'Admin — Liability insurance',
  'Admin — Membership dues to TXPTA',
  'Admin — Membership management (MemberPlanet)',
  'Admin — PTA expenses',
  'Admin — Tax return preparation',
  'Admin — Website (Site5)',
  'Annual Fund',
  'Blacktop maintenance',
  'Class gardens',
  'Classroom — Special Areas teacher reimbursement',
  'Classroom — Teacher development',
  'Classroom — Teacher reimbursement',
  'Community events',
  "Counselor's fund",
  'Courtesy — Teacher/staff appreciation',
  'Cultural arts',
  'Fundraiser #1 (Carnival)',
  'Fundraiser #2 (Spring Fling)',
  'Fundraiser #3 (Fall parent event)',
  'Fundraiser — Sponsorship signs',
  'Grant: CoA BGF Gardening',
  'Grant: CoA BGF Grounds',
  'Grant: National PTA Ready Tech Go',
  'Greenworks',
  'HEPA Filters',
  'Hospitality — Monthly teacher appreciation event',
  'Hospitality — End of semester gifts for nontraditional',
  'Library',
  'Literacy library',
  'Maker cart (Supplies, storage, & maintenance)',
  'Nick Akery scholarship',
  'Online Store — Cost of goods',
  'Parent speaker series',
  'P.E. Fund/Ninja (old CATCH committee)',
  'School improvements (Paint the Hall)',
  "Principal's wish list",
  'PTA officer training',
  'Scholarships (Students for trips)',
  'Snacks for classrooms',
  'Student merch (t-shirts & stickers)',
  'Teacher grant program for Fall',
  'Teacher grant program for Spring',
  'Teacher lounge coffee & food',
  'Teacher retirement/commemoration',
  'Technology maintenance & repair fund',
  'Unified Champions',
  'Yearbook',
] as const;

export type BudgetAccount = (typeof BUDGET_ACCOUNTS)[number];

export const requesterSchema = z.object({
  payableTo: z.string().min(1, 'Payable to is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  dateOfRequest: z.string().min(1, 'Date of request is required'),
  dateCheckNeeded: z.string().min(1, 'Date check needed is required'),
  invoiceNumber: z.string().optional(),
});

/** Admin-only update of submission contact fields (matches `submissions` columns). */
export const adminSubmissionContactSchema = z.object({
  requester_name: z.string().min(1, 'Name is required'),
  requester_email: z.string().email('Valid email is required'),
  requester_phone: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null) return null;
      const t = v.trim();
      return t === '' ? null : t;
    }),
});

export type AdminSubmissionContact = z.infer<typeof adminSubmissionContactSchema>;

const optionalIsoDate = z.preprocess((val) => {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'string') return val.trim() === '' ? null : val.trim();
  return val;
}, z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]));

/** Admin-only treasurer / check fields (`submissions` columns). */
export const adminTreasurerFieldsSchema = z.object({
  check_amount: z.preprocess((val) => {
    if (val === '' || val === undefined) return null;
    if (val === null) return null;
    if (typeof val === 'number') return val;
    const n = Number(val);
    return Number.isFinite(n) ? n : val;
  }, z.union([z.number().nonnegative(), z.null()])),
  check_number: z.preprocess((val) => {
    if (val === undefined || val === null || val === '') return null;
    if (typeof val === 'string') {
      const t = val.trim();
      return t === '' ? null : t;
    }
    return val;
  }, z.union([z.string(), z.null()])),
  date_paid: optionalIsoDate,
});

export type AdminTreasurerFields = z.infer<typeof adminTreasurerFieldsSchema>;

export const receiptSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  placeOfPurchase: z.string().optional(),
  budgetAccount: z.string().optional(), // Used when splitting accounts
});

export const fileSchema = z.object({
  key: z.string().refine(isValidStagingUploadKey, 'Invalid or unrecognized file storage key'),
  filename: z.string(),
  contentType: z.string(),
  size: z.number(),
  /** 1-based index matching the receipt row on the form (used for R2 friendly names). */
  receiptLineIndex: z.number().int().min(1).max(4),
  /** Signed preview URL params from convert-receipt (not persisted on submit). */
  fileAccessExp: z.number().int().optional(),
  fileAccessSig: z.string().optional(),
});

export const budgetSelectionSchema = z.object({
  primaryAccount: z.string().min(1, 'Budget account is required'),
  splitAccounts: z.boolean().default(false),
});

export const submissionSchema = z.object({
  requester: requesterSchema,
  receipts: z.array(receiptSchema).min(1, 'At least one receipt is required').max(4),
  files: z.array(fileSchema).max(8),
  budget: budgetSelectionSchema,
});

export type RequesterData = z.infer<typeof requesterSchema>;
export type ReceiptData = z.infer<typeof receiptSchema>;
export type FileData = z.infer<typeof fileSchema>;
export type BudgetSelectionData = z.infer<typeof budgetSelectionSchema>;
export type SubmissionData = z.infer<typeof submissionSchema>;
