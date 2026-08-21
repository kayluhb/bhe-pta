/** `2026-27` → `2026-2027` for display copy. */
export function formatSchoolYearLong(schoolYear: string): string {
  const [startYear, endSuffix] = schoolYear.split('-');
  if (!startYear || !endSuffix) return schoolYear;
  const century = startYear.slice(0, 2);
  return `${startYear}-${century}${endSuffix}`;
}
