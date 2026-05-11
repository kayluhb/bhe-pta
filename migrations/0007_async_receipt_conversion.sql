ALTER TABLE receipt_conversion_jobs ADD COLUMN submission_id TEXT;
ALTER TABLE receipt_conversion_jobs ADD COLUMN submission_slug TEXT;
ALTER TABLE receipt_conversion_jobs ADD COLUMN receipt_line_index INTEGER;

CREATE INDEX idx_receipt_conversion_jobs_submission
  ON receipt_conversion_jobs(submission_id);

ALTER TABLE submissions ADD COLUMN email_sent_at TEXT;
-- Persist the requester fields needed to rebuild the treasurer notification email
-- after submit (the queue consumer dispatches it once all receipt conversions finish).
ALTER TABLE submissions ADD COLUMN requester_address TEXT;
ALTER TABLE submissions ADD COLUMN date_check_needed TEXT;
