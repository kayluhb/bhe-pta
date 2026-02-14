import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const submissions = sqliteTable('submissions', {
  id: text('id').primaryKey(),
  requesterName: text('requester_name').notNull(),
  requesterEmail: text('requester_email').notNull(),
  requesterPhone: text('requester_phone'),
  status: text('status', { enum: ['pending', 'approved', 'rejected', 'needs_info'] })
    .notNull()
    .default('pending'),
  totalAmount: real('total_amount').notNull().default(0),
  pdfKey: text('pdf_key'),
  submittedAt: text('submitted_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const receiptEntries = sqliteTable('receipt_entries', {
  id: text('id').primaryKey(),
  submissionId: text('submission_id').notNull().references(() => submissions.id, { onDelete: 'cascade' }),
  receiptDate: text('receipt_date').notNull(),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  category: text('category').notNull(),
  vendor: text('vendor'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const fileAttachments = sqliteTable('file_attachments', {
  id: text('id').primaryKey(),
  submissionId: text('submission_id').notNull().references(() => submissions.id, { onDelete: 'cascade' }),
  r2Key: text('r2_key').notNull(),
  originalFilename: text('original_filename').notNull(),
  contentType: text('content_type').notNull(),
  fileSize: integer('file_size').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  uploadedAt: text('uploaded_at').notNull().default(sql`(datetime('now'))`),
});

export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type ReceiptEntry = typeof receiptEntries.$inferSelect;
export type NewReceiptEntry = typeof receiptEntries.$inferInsert;
export type FileAttachment = typeof fileAttachments.$inferSelect;
export type NewFileAttachment = typeof fileAttachments.$inferInsert;
