-- Treasurer / check fulfillment fields for PDF and records
ALTER TABLE submissions ADD COLUMN date_approved TEXT;
ALTER TABLE submissions ADD COLUMN date_received TEXT;
ALTER TABLE submissions ADD COLUMN check_number TEXT;
ALTER TABLE submissions ADD COLUMN check_amount REAL;
