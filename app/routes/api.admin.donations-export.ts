import {listActiveCampaigns} from '~/data/campaigns';
import {requireAdmin} from '~/lib/admin/auth';
import type {Route} from './+types/api.admin.donations-export';

function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

interface ExportRow {
  amount_cents: number;
  campaign_slug: string;
  completed_at: string | null;
  created_at: string;
  donor_email: string;
  donor_fields: string | null;
  donor_name: string | null;
  id: string;
  preset_id: string | null;
  provider: string;
  provider_payment_id: string | null;
  status: string;
}

export async function loader({request, context}: Route.LoaderArgs) {
  const auth = await requireAdmin(request, context.cloudflare.env);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const campaignFilter = url.searchParams.get('campaign') || '';
  const statusFilter = url.searchParams.get('status') || '';

  const db = context.cloudflare.env.REIMBURSEMENT_DB;
  const validSlugs = new Set(listActiveCampaigns().map((c) => c.slug));

  const conditions: string[] = [];
  const binds: string[] = [];

  if (campaignFilter && validSlugs.has(campaignFilter)) {
    conditions.push('campaign_slug = ?');
    binds.push(campaignFilter);
  }
  if (statusFilter) {
    conditions.push('status = ?');
    binds.push(statusFilter);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  let rows: ExportRow[] = [];
  try {
    const result = await db
      .prepare(
        `SELECT id, campaign_slug, provider, provider_payment_id, amount_cents, status,
                donor_name, donor_email, donor_fields, preset_id, created_at, completed_at
         FROM donations ${where}
         ORDER BY COALESCE(completed_at, created_at) DESC`,
      )
      .bind(...binds)
      .all<ExportRow>();
    rows = result.results;
  } catch {
    rows = [];
  }

  const headers = [
    'id',
    'campaign_slug',
    'status',
    'amount_dollars',
    'donor_name',
    'donor_email',
    'preset_id',
    'donor_fields',
    'provider',
    'provider_payment_id',
    'created_at',
    'completed_at',
  ];

  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      [
        row.id,
        row.campaign_slug,
        row.status,
        (row.amount_cents / 100).toFixed(2),
        row.donor_name,
        row.donor_email,
        row.preset_id,
        row.donor_fields,
        row.provider,
        row.provider_payment_id,
        row.created_at,
        row.completed_at,
      ]
        .map(escapeCsvValue)
        .join(','),
    ),
  ];

  const date = new Date().toISOString().slice(0, 10);
  return new Response(lines.join('\n'), {
    headers: {
      'Content-Disposition': `attachment; filename="bhe-pta-donations-${date}.csv"`,
      'Content-Type': 'text/csv; charset=utf-8',
    },
  });
}
