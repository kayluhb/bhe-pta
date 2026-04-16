CREATE TABLE receipt_conversion_jobs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'queued',
  original_key TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  original_content_type TEXT NOT NULL,
  original_size INTEGER NOT NULL,
  converted_key TEXT,
  converted_filename TEXT,
  converted_size INTEGER,
  receipt_number TEXT,
  payable_to TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_receipt_conversion_jobs_status_created
  ON receipt_conversion_jobs(status, created_at DESC);
