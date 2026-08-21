import {describe, expect, it} from 'vitest';

import {formatSchoolYearLong} from '../school-year';

describe('school-year', () => {
  it('formats school years for display', () => {
    expect(formatSchoolYearLong('2026-27')).toBe('2026-2027');
    expect(formatSchoolYearLong('2025-26')).toBe('2025-2026');
  });
});
