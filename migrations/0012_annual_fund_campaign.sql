-- Published Annual Fund thermometer. One row; the site falls back to code until the first admin save.

CREATE TABLE annual_fund_campaign (
  id TEXT PRIMARY KEY,
  online_raised_amount REAL NOT NULL,
  offline_raised_amount REAL NOT NULL,
  goal_amount REAL NOT NULL,
  suggested_ask_per_child INTEGER NOT NULL,
  last_updated TEXT NOT NULL,
  school_year TEXT NOT NULL,
  title TEXT NOT NULL,
  milestones_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
