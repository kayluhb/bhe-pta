import {requireAdmin} from '~/lib/admin/auth';
import type {Route} from './+types/api.admin.school-year';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function action({request, params, context}: Route.ActionArgs) {
  const auth = await requireAdmin(request, context.cloudflare.env);
  if (auth instanceof Response) return auth;

  const schoolYearId = params.schoolYearId;
  if (!schoolYearId) {
    return Response.json({error: 'Missing school year id'}, {status: 400});
  }

  const db = context.cloudflare.env.REIMBURSEMENT_DB;

  if (request.method === 'PATCH') {
    const body = (await request.json()) as {
      ends_on?: string;
      is_default?: boolean;
      label?: string;
      sort_order?: number;
      starts_on?: string;
    };

    const row = await db
      .prepare(
        'SELECT id, label, starts_on, ends_on, sort_order, is_default FROM school_years WHERE id = ?',
      )
      .bind(schoolYearId)
      .first<{
        ends_on: string;
        id: string;
        is_default: number;
        label: string;
        sort_order: number;
        starts_on: string;
      }>();
    if (!row) {
      return Response.json({error: 'School year not found'}, {status: 404});
    }

    const nextLabel = body.label !== undefined ? body.label.trim() : row.label;
    if (!nextLabel) {
      return Response.json({error: 'label cannot be empty'}, {status: 400});
    }

    if (body.label !== undefined) {
      const other = await db
        .prepare('SELECT id FROM school_years WHERE label = ? AND id != ?')
        .bind(nextLabel, schoolYearId)
        .first<{id: string}>();
      if (other) {
        return Response.json(
          {error: 'Another school year already uses this label.'},
          {status: 409},
        );
      }
    }

    const nextStarts = body.starts_on !== undefined ? body.starts_on : row.starts_on;
    const nextEnds = body.ends_on !== undefined ? body.ends_on : row.ends_on;
    if (!ISO_DATE.test(nextStarts) || !ISO_DATE.test(nextEnds)) {
      return Response.json({error: 'starts_on and ends_on must be YYYY-MM-DD'}, {status: 400});
    }

    const nextSort =
      body.sort_order !== undefined &&
      typeof body.sort_order === 'number' &&
      Number.isFinite(body.sort_order)
        ? Math.trunc(body.sort_order)
        : row.sort_order;

    const wantsDefault = body.is_default === true;
    const statements: D1PreparedStatement[] = [];
    if (wantsDefault) {
      statements.push(
        db.prepare(`UPDATE school_years SET is_default = 0, updated_at = datetime('now')`),
      );
    }
    statements.push(
      db
        .prepare(
          `UPDATE school_years SET
             label = ?,
             starts_on = ?,
             ends_on = ?,
             sort_order = ?,
             is_default = CASE WHEN ? = 1 THEN 1 ELSE is_default END,
             updated_at = datetime('now')
           WHERE id = ?`,
        )
        .bind(nextLabel, nextStarts, nextEnds, nextSort, wantsDefault ? 1 : 0, schoolYearId),
    );

    await db.batch(statements);
    return Response.json({success: true});
  }

  if (request.method === 'DELETE') {
    const row = await db
      .prepare('SELECT is_default FROM school_years WHERE id = ?')
      .bind(schoolYearId)
      .first<{is_default: number}>();
    if (!row) {
      return Response.json({error: 'School year not found'}, {status: 404});
    }

    const usage = await db
      .prepare('SELECT COUNT(*) as c FROM submissions WHERE school_year_id = ?')
      .bind(schoolYearId)
      .first<{c: number}>();
    const n = Number(usage?.c ?? 0) || 0;
    if (n > 0) {
      return Response.json(
        {error: `Cannot delete: ${n} reimbursement submission(s) reference this school year.`},
        {status: 409},
      );
    }

    const totalYears = await db
      .prepare('SELECT COUNT(*) as c FROM school_years')
      .first<{c: number}>();
    if ((Number(totalYears?.c ?? 0) || 0) <= 1) {
      return Response.json({error: 'Cannot delete the only school year.'}, {status: 400});
    }

    if (row.is_default) {
      return Response.json(
        {
          error:
            'Cannot delete the default school year. Set another year as default first, then delete this one.',
        },
        {status: 400},
      );
    }

    await db.prepare('DELETE FROM school_years WHERE id = ?').bind(schoolYearId).run();
    return Response.json({success: true});
  }

  return Response.json({error: 'Method not allowed'}, {status: 405});
}
