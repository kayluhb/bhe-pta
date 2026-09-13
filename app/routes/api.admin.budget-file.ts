import {requireAdmin} from '~/lib/admin/auth';
import {assertValidBudgetMonthId, type BudgetMonthRow} from '~/lib/budget/ids';
import {getCloudflare} from '~/lib/cloudflare-context';
import type {Route} from './+types/api.admin.budget-file';

/**
 * Download a stored budget or P&L CSV for a month.
 * GET /api/admin/budgets/:id/file?kind=budget|pl
 */
export async function loader({request, context, params}: Route.LoaderArgs) {
  const env = getCloudflare(context).env;
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const id = params.id?.trim() ?? '';
  const idErr = assertValidBudgetMonthId(id);
  if (idErr) return Response.json({error: idErr}, {status: 400});

  const kind = new URL(request.url).searchParams.get('kind') ?? 'budget';
  if (kind !== 'budget' && kind !== 'pl') {
    return Response.json({error: 'kind must be budget or pl'}, {status: 400});
  }

  const row = await env.REIMBURSEMENT_DB.prepare('SELECT * FROM budget_months WHERE id = ?')
    .bind(id)
    .first<BudgetMonthRow>();
  if (!row) return Response.json({error: 'Budget month not found'}, {status: 404});

  const key = kind === 'budget' ? row.budget_r2_key : row.pl_r2_key;
  if (!key) {
    return Response.json({error: 'No P&L file stored for this month'}, {status: 404});
  }

  const object = await env.R2_BUCKET.get(key);
  if (!object) return Response.json({error: 'File not found in storage'}, {status: 404});

  const filename =
    kind === 'budget' ? `${row.label}.csv` : `${row.label} - Profit and Loss Detail.csv`;

  return new Response(object.body, {
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': object.httpMetadata?.contentType || 'text/csv',
    },
  });
}
