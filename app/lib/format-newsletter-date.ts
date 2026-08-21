/** Normalize newsletter date strings to `YYYY-MM-DD` when possible. */
export function toIsoDay(dateStr: string): string | null {
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  const isoDay = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDay) return isoDay[1];

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Format a newsletter date for display; returns '' for unparseable values. */
export function formatNewsletterDate(dateStr: string): string {
  const isoDay = toIsoDay(dateStr);
  if (!isoDay) return '';

  const date = new Date(`${isoDay}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
