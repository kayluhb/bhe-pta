-- Date received is always the submission creation time (submitted_at), not a separate field.
ALTER TABLE submissions DROP COLUMN date_received;
