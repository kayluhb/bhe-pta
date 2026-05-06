import {requireAdmin} from '~/lib/admin/auth';
import type {Route} from './+types/api.admin.reimbursements-export';

function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

interface ExportRow {
  admin_notes: string | null;
  category: string | null;
  check_amount: number | null;
  check_number: string | null;
  date_approved: string | null;
  date_paid: string | null;
  description: string | null;
  id: string;
  receipt_amount: number | null;
  receipt_date: string | null;
  requester_email: string;
  requester_name: string;
  school_year_id: string;
  school_year_label: string | null;
  status: string;
  submitted_at: string;
  total_amount: number;
  vendor: string | null;
}

export async function loader({request, context}: Route.LoaderArgs) {
  const auth = await requireAdmin(request, context.cloudflare.env);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const idsParam = url.searchParams.get('ids');
  const schoolYearFilter = url.searchParams.get('schoolYear');
  const statusFilter = url.searchParams.get('status');

  const db = context.cloudflare.env.REIMBURSEMENT_DB;

  let query = `
    SELECT s.id, s.submitted_at, s.requester_name, s.requester_email, s.total_amount, s.status, s.admin_notes,
           s.check_amount, s.check_number, s.date_approved, s.date_paid,
           s.school_year_id, y.label AS school_year_label,
           r.receipt_date, r.description, r.vendor, r.category, r.amount as receipt_amount
    FROM submissions s
    LEFT JOIN school_years y ON y.id = s.school_year_id
    LEFT JOIN receipt_entries r ON r.submission_id = s.id
  `;

  const params: string[] = [];
  const conditions: string[] = [];

  if (idsParam) {
    const ids = idsParam.split(',').filter(Boolean);
    if (ids.length > 0) {
      conditions.push(`s.id IN (${ids.map(() => '?').join(', ')})`);
      params.push(...ids);
    }
  } else {
    if (statusFilter) {
      conditions.push('s.status = ?');
      params.push(statusFilter);
    }
    if (schoolYearFilter) {
      const valid = await db
        .prepare('SELECT id FROM school_years WHERE id = ?')
        .bind(schoolYearFilter)
        .first<{id: string}>();
      if (valid) {
        conditions.push('s.school_year_id = ?');
        params.push(schoolYearFilter);
      }
    }
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ' ORDER BY s.submitted_at DESC, r.sort_order';

  const stmt = params.length ? db.prepare(query).bind(...params) : db.prepare(query);

  const results = await stmt.all<ExportRow>();

  const headers = [
    'Submission ID',
    'Date',
    'Requester',
    'Email',
    'Total Amount',
    'Status',
    'School Year',
    'Notes',
    'Date Approved',
    'Date Paid',
    'Check Number',
    'Check Amount',
    'Receipt Date',
    'Description',
    'Vendor',
    'Budget Account',
    'Receipt Amount',
  ];

  const rows = results.results.map((row) =>
    [
      row.id,
      row.submitted_at,
      row.requester_name,
      row.requester_email,
      row.total_amount,
      row.status,
      row.school_year_label ?? row.school_year_id,
      row.admin_notes,
      row.date_approved,
      row.date_paid,
      row.check_number,
      row.check_amount,
      row.receipt_date,
      row.description,
      row.vendor,
      row.category,
      row.receipt_amount,
    ]
      .map(escapeCsvValue)
      .join(','),
  );

  const csv = [headers.join(','), ...rows].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Disposition': `attachment; filename="reimbursements-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Content-Type': 'text/csv',
    },
  });
}
