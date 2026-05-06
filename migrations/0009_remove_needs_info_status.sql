-- Retire needs_info: move existing rows back to pending for treasurer follow-up.
UPDATE submissions
SET status = 'pending', updated_at = datetime('now')
WHERE status = 'needs_info';
