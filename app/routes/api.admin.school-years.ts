import {requireAdmin} from '~/lib/admin/auth';
import {getCloudflare} from '~/lib/cloudflare-context';
import {assertValidSchoolYearId, slugSchoolYearIdFromLabel} from '~/lib/reimbursement/school-years';
import type {Route} from './+types/api.admin.school-years';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function action({request, context}: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return Response.json({error: 'Method not allowed'}, {status: 405});
  }

  const env = getCloudflare(context).env;
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const body = (await request.json()) as {
    ends_on?: string;
    id?: string;
    is_default?: boolean;
    label?: string;
    sort_order?: number;
    starts_on?: string;
  };

  if (!body.label || typeof body.label !== 'string' || !body.label.trim()) {
    return Response.json({error: 'label is required'}, {status: 400});
  }
  if (
    !body.starts_on ||
    typeof body.starts_on !== 'string' ||
    !body.ends_on ||
    typeof body.ends_on !== 'string'
  ) {
    return Response.json({error: 'starts_on and ends_on are required (YYYY-MM-DD)'}, {status: 400});
  }
  if (!ISO_DATE.test(body.starts_on) || !ISO_DATE.test(body.ends_on)) {
    return Response.json({error: 'starts_on and ends_on must be YYYY-MM-DD'}, {status: 400});
  }

  const idCandidate =
    typeof body.id === 'string' && body.id.trim()
      ? body.id.trim()
      : slugSchoolYearIdFromLabel(body.label);
  const idErr = assertValidSchoolYearId(idCandidate);
  if (idErr) {
    return Response.json({error: idErr}, {status: 400});
  }

  const db = env.REIMBURSEMENT_DB;
  const clash = await db
    .prepare('SELECT id FROM school_years WHERE id = ? OR label = ?')
    .bind(idCandidate, body.label.trim())
    .first<{id: string}>();
  if (clash) {
    return Response.json(
      {error: 'A school year with this id or label already exists.'},
      {status: 409},
    );
  }

  const sortOrder =
    typeof body.sort_order === 'number' && Number.isFinite(body.sort_order)
      ? Math.trunc(body.sort_order)
      : Number.parseInt(body.starts_on.slice(0, 4), 10) || 0;
  const isDefault = Boolean(body.is_default);

  const statements = [];
  if (isDefault) {
    statements.push(
      db.prepare(`UPDATE school_years SET is_default = 0, updated_at = datetime('now')`),
    );
  }
  statements.push(
    db
      .prepare(
        `INSERT INTO school_years (id, label, starts_on, ends_on, is_default, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        idCandidate,
        body.label.trim(),
        body.starts_on,
        body.ends_on,
        isDefault ? 1 : 0,
        sortOrder,
      ),
  );

  await db.batch(statements as D1PreparedStatement[]);

  return Response.json({id: idCandidate, success: true});
}
