-- School years (admin CRUD) and link every submission to exactly one year.

CREATE TABLE school_years (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  starts_on TEXT NOT NULL,
  ends_on TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX idx_school_years_label ON school_years(label);

INSERT INTO school_years (id, label, starts_on, ends_on, is_default, sort_order)
VALUES ('2025-26', '2025-26', '2025-08-01', '2026-07-31', 1, 2025);

-- D1/SQLite: REFERENCES on ADD COLUMN with NOT NULL DEFAULT fails (SQLITE_ERROR 7500).
-- Integrity is enforced by app + idx_submissions_school_year; FK not added via ALTER.
ALTER TABLE submissions ADD COLUMN school_year_id TEXT NOT NULL DEFAULT '2025-26';

CREATE INDEX idx_submissions_school_year ON submissions(school_year_id);
