import {requireAdmin} from '~/lib/admin/auth';
import {generateMonthBudget, monthLabelFromId} from '~/lib/budget/generate-month';
import {
  assertValidBudgetMonthId,
  type BudgetMonthRow,
  budgetCsvR2Key,
  plCsvR2Key,
} from '~/lib/budget/ids';
import {parseBankBalanceToCents} from '~/lib/budget/money';
import {extractPlBudgetActuals} from '~/lib/budget/pl-parse';
import {getCloudflare} from '~/lib/cloudflare-context';
import type {Route} from './+types/api.admin.budgets-generate';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Generate (or overwrite) a budget month from a P&L CSV + template month.
 * multipart: file (P&L), id, label?, template_month_id, as_of_date, bank_balance
 */
export async function action({request, context}: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return Response.json({error: 'Method not allowed'}, {status: 405});
  }

  const env = getCloudflare(context).env;
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const form = await request.formData();
  const file = form.get('file');
  const idRaw = String(form.get('id') ?? '').trim();
  const labelRaw = String(form.get('label') ?? '').trim();
  const templateId = String(form.get('template_month_id') ?? '').trim();
  const asOf = String(form.get('as_of_date') ?? '').trim();
  const balanceRaw = String(form.get('bank_balance') ?? '').trim();

  if (!(file instanceof File) || file.size === 0) {
    return Response.json({error: 'P&L CSV file is required'}, {status: 400});
  }
  const idErr = assertValidBudgetMonthId(idRaw);
  if (idErr) return Response.json({error: idErr}, {status: 400});
  if (!templateId) {
    return Response.json({error: 'template_month_id is required'}, {status: 400});
  }
  if (templateId === idRaw) {
    return Response.json(
      {error: 'template_month_id must differ from the target month id'},
      {status: 400},
    );
  }
  if (!ISO_DATE.test(asOf)) {
    return Response.json({error: 'as_of_date must be YYYY-MM-DD'}, {status: 400});
  }
  const bankBalanceCents = parseBankBalanceToCents(balanceRaw);
  if (bankBalanceCents == null) {
    return Response.json({error: 'bank_balance is required (e.g. 137289.55)'}, {status: 400});
  }

  const db = env.REIMBURSEMENT_DB;
  const r2 = env.R2_BUCKET;

  const template = await db
    .prepare('SELECT * FROM budget_months WHERE id = ?')
    .bind(templateId)
    .first<BudgetMonthRow>();
  if (!template) {
    return Response.json({error: 'Template month not found'}, {status: 404});
  }

  const templateObj = await r2.get(template.budget_r2_key);
  if (!templateObj) {
    return Response.json({error: 'Template budget CSV missing from storage'}, {status: 404});
  }
  const templateCsv = await templateObj.text();

  const plText = await file.text();
  let generated: ReturnType<typeof generateMonthBudget>;
  try {
    const {actuals: plActuals} = extractPlBudgetActuals(plText);
    generated = generateMonthBudget({
      asOfDate: asOf,
      bankBalanceCents,
      plActuals,
      previousLabel: template.label,
      templateCsv,
    });
  } catch (err) {
    return Response.json(
      {error: err instanceof Error ? err.message : 'Failed to parse P&L or generate budget CSV'},
      {status: 400},
    );
  }

  const label = labelRaw || monthLabelFromId(idRaw);
  const budgetKey = budgetCsvR2Key(idRaw);
  const plKey = plCsvR2Key(idRaw);

  const labelClash = await db
    .prepare('SELECT id FROM budget_months WHERE label = ? AND id != ?')
    .bind(label, idRaw)
    .first<{id: string}>();
  if (labelClash) {
    return Response.json({error: 'A budget month with this label already exists'}, {status: 409});
  }

  const existing = await db
    .prepare('SELECT id FROM budget_months WHERE id = ?')
    .bind(idRaw)
    .first<{id: string}>();

  await Promise.all([
    r2.put(budgetKey, generated.csv, {httpMetadata: {contentType: 'text/csv'}}),
    r2.put(plKey, plText, {httpMetadata: {contentType: 'text/csv'}}),
  ]);

  if (existing) {
    await db
      .prepare(
        `UPDATE budget_months
         SET label = ?, as_of_date = ?, bank_balance_cents = ?, template_month_id = ?,
             budget_r2_key = ?, pl_r2_key = ?, updated_at = datetime('now'), created_by = ?
         WHERE id = ?`,
      )
      .bind(label, asOf, bankBalanceCents, templateId, budgetKey, plKey, auth.email, idRaw)
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO budget_months
          (id, label, as_of_date, bank_balance_cents, template_month_id, budget_r2_key, pl_r2_key, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(idRaw, label, asOf, bankBalanceCents, templateId, budgetKey, plKey, auth.email)
      .run();
  }

  const row = await db
    .prepare('SELECT * FROM budget_months WHERE id = ?')
    .bind(idRaw)
    .first<BudgetMonthRow>();

  return Response.json({
    applied: generated.applied,
    month: row,
    overwritten: Boolean(existing),
    success: true,
    unmatchedBudgetLines: generated.unmatchedBudgetLines,
  });
}
