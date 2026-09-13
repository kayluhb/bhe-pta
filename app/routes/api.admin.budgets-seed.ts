import {requireAdmin} from '~/lib/admin/auth';
import {monthLabelFromId} from '~/lib/budget/generate-month';
import {assertValidBudgetMonthId, type BudgetMonthRow, budgetCsvR2Key} from '~/lib/budget/ids';
import {parseBankBalanceToCents, parseMoney} from '~/lib/budget/money';
import {getCloudflare} from '~/lib/cloudflare-context';
import type {Route} from './+types/api.admin.budgets-seed';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Seed a budget month by uploading an existing budget CSV (no P&L conversion).
 * multipart: file, id, label?, as_of_date, bank_balance?
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
  const asOf = String(form.get('as_of_date') ?? '').trim();
  const balanceRaw = String(form.get('bank_balance') ?? '').trim();

  if (!(file instanceof File) || file.size === 0) {
    return Response.json({error: 'Budget CSV file is required'}, {status: 400});
  }
  const idErr = assertValidBudgetMonthId(idRaw);
  if (idErr) return Response.json({error: idErr}, {status: 400});
  if (!ISO_DATE.test(asOf)) {
    return Response.json({error: 'as_of_date must be YYYY-MM-DD'}, {status: 400});
  }

  const csvText = await file.text();
  let bankBalanceCents = balanceRaw ? parseBankBalanceToCents(balanceRaw) : null;
  if (bankBalanceCents == null) {
    bankBalanceCents = parseBalanceFromBudgetHeader(csvText);
  }
  if (bankBalanceCents == null) {
    return Response.json(
      {error: 'bank_balance is required (or include “current balance $…” in the CSV header)'},
      {status: 400},
    );
  }

  const label = labelRaw || monthLabelFromId(idRaw);
  const r2Key = budgetCsvR2Key(idRaw);
  const db = env.REIMBURSEMENT_DB;
  const r2 = env.R2_BUCKET;

  const existing = await db
    .prepare('SELECT id FROM budget_months WHERE id = ? OR label = ?')
    .bind(idRaw, label)
    .first<{id: string}>();

  if (existing && existing.id !== idRaw) {
    return Response.json({error: 'A budget month with this label already exists'}, {status: 409});
  }

  await r2.put(r2Key, csvText, {httpMetadata: {contentType: 'text/csv'}});

  if (existing) {
    await db
      .prepare(
        `UPDATE budget_months
         SET label = ?, as_of_date = ?, bank_balance_cents = ?, template_month_id = NULL,
             budget_r2_key = ?, pl_r2_key = NULL, updated_at = datetime('now'), created_by = ?
         WHERE id = ?`,
      )
      .bind(label, asOf, bankBalanceCents, r2Key, auth.email, idRaw)
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO budget_months
          (id, label, as_of_date, bank_balance_cents, template_month_id, budget_r2_key, pl_r2_key, created_by)
         VALUES (?, ?, ?, ?, NULL, ?, NULL, ?)`,
      )
      .bind(idRaw, label, asOf, bankBalanceCents, r2Key, auth.email)
      .run();
  }

  const row = await db
    .prepare('SELECT * FROM budget_months WHERE id = ?')
    .bind(idRaw)
    .first<BudgetMonthRow>();

  return Response.json({month: row, overwritten: Boolean(existing), success: true});
}

function parseBalanceFromBudgetHeader(csvText: string): number | null {
  const match = /current balance\s+(\$?[\d,]+\.?\d*)/i.exec(csvText.slice(0, 500));
  if (!match) return null;
  const dollars = parseMoney(match[1] ?? '');
  if (dollars == null) return null;
  return Math.round(dollars * 100);
}
