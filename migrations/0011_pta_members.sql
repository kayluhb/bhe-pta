-- Tracks every person already exported into a Texas PTA import CSV, per school year, so
-- re-uploading a fuller Cheddar Up export only emits people not already exported.

CREATE TABLE pta_members (
  id TEXT PRIMARY KEY,
  school_year_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('primary', 'spouse', 'child')),
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  zip TEXT NOT NULL DEFAULT '',
  home_phone TEXT NOT NULL DEFAULT '',
  cell_phone TEXT NOT NULL DEFAULT '',
  lifetime INTEGER NOT NULL DEFAULT 0 CHECK (lifetime IN (0, 1)),
  paid_date TEXT NOT NULL,
  source_document_number TEXT NOT NULL DEFAULT '',
  imported_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX idx_pta_members_year_email ON pta_members(school_year_id, email);
