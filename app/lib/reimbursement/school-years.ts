const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,62}$/;

export function assertValidSchoolYearId(id: string): string | null {
  const t = id.trim();
  if (!ID_PATTERN.test(t)) {
    return 'School year id must be 1–63 characters: letters, digits, dot, underscore, or hyphen; must start with a letter or digit.';
  }
  return null;
}

export function slugSchoolYearIdFromLabel(label: string): string {
  return label
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]+/g, '')
    .slice(0, 63);
}

/**
 * Resolves which `school_years.id` to attach to a new public submission.
 * Returns a Response when configuration is missing.
 */
export async function resolveSchoolYearIdForNewSubmission(
  db: D1Database,
): Promise<{ok: true; schoolYearId: string} | {ok: false; response: Response}> {
  const preferred = await db
    .prepare(
      'SELECT id FROM school_years WHERE is_default = 1 ORDER BY sort_order DESC, starts_on DESC LIMIT 1',
    )
    .first<{id: string}>();

  if (preferred?.id) {
    return {ok: true, schoolYearId: preferred.id};
  }

  const fallback = await db
    .prepare('SELECT id FROM school_years ORDER BY sort_order DESC, starts_on DESC LIMIT 1')
    .first<{id: string}>();

  if (fallback?.id) {
    return {ok: true, schoolYearId: fallback.id};
  }

  return {
    ok: false,
    response: Response.json(
      {
        error:
          'Reimbursements are not configured with a school year. An administrator must add one under Admin → School years.',
      },
      {status: 503},
    ),
  };
}
