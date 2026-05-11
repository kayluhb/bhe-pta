/** Escape `%`, `_`, and `\` for use in SQLite LIKE patterns with `ESCAPE '\'` */
export function escapeSqlLikePattern(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

const LIKE_ESCAPE = "ESCAPE '\\'";

/**
 * WHERE fragment matching requester name/email; if `term` is all digits, also matches submission `id`.
 * `alias` is optional table prefix (e.g. `s` for `s.requester_name`).
 */
export function submissionSearchCondition(
  term: string,
  alias?: string,
): {binds: (string | number)[]; sql: string} {
  const t = term.trim();
  if (!t) return {binds: [], sql: ''};
  const col = (name: string) => (alias ? `${alias}.${name}` : name);
  const pattern = `%${escapeSqlLikePattern(t)}%`;
  if (/^\d+$/.test(t)) {
    return {
      binds: [Number(t), pattern, pattern],
      sql: `(${col('id')} = ? OR ${col('requester_name')} LIKE ? ${LIKE_ESCAPE} OR ${col('requester_email')} LIKE ? ${LIKE_ESCAPE})`,
    };
  }
  return {
    binds: [pattern, pattern],
    sql: `(${col('requester_name')} LIKE ? ${LIKE_ESCAPE} OR ${col('requester_email')} LIKE ? ${LIKE_ESCAPE})`,
  };
}
