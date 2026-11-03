-- Public thermometer visibility. Admin preview still shows while hidden.
ALTER TABLE annual_fund_campaign ADD COLUMN thermometer_visible INTEGER NOT NULL DEFAULT 1;
