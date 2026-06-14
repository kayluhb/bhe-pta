import {useLoaderData} from 'react-router';

import {listActiveCampaigns} from '~/data/campaigns';
import {requireAdmin, type SessionPayload} from '~/lib/admin/auth';
import {formatUsd} from '~/lib/format-currency';
import {mergeParentMeta} from '~/lib/meta';
import type {Route} from './+types/admin.donations';

export function meta({matches}: Route.MetaArgs) {
  return mergeParentMeta(matches, [{title: 'Donations Admin | Barton Hills Elementary PTA'}]);
}

interface DonationRow {
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
  status: string;
}

const PAGE_SIZE = 50;

export async function loader({request, context}: Route.LoaderArgs) {
  const auth = await requireAdmin(request, context.cloudflare.env);
  if (auth instanceof Response) return auth;
  const user: SessionPayload = auth;

  const url = new URL(request.url);
  const campaignFilter = url.searchParams.get('campaign') || '';
  const statusFilter = url.searchParams.get('status') || '';
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const db = context.cloudflare.env.REIMBURSEMENT_DB;
  const campaigns = listActiveCampaigns();
  const validSlugs = new Set(campaigns.map((c) => c.slug));

  const conditions: string[] = [];
  const binds: (string | number)[] = [];

  if (campaignFilter && validSlugs.has(campaignFilter)) {
    conditions.push('campaign_slug = ?');
    binds.push(campaignFilter);
  }
  if (statusFilter) {
    conditions.push('status = ?');
    binds.push(statusFilter);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  let donations: DonationRow[] = [];
  let total = 0;
  let totalCompletedCents = 0;

  try {
    const countRow = await db
      .prepare(`SELECT COUNT(*) AS cnt FROM donations ${where}`)
      .bind(...binds)
      .first<{cnt: number}>();
    total = countRow?.cnt ?? 0;

    const completedConditions = [...conditions, "status = 'completed'"];
    const completedWhere =
      completedConditions.length > 0 ? `WHERE ${completedConditions.join(' AND ')}` : '';
    const sumRow = await db
      .prepare(`SELECT COALESCE(SUM(amount_cents), 0) AS total FROM donations ${completedWhere}`)
      .bind(...binds)
      .first<{total: number}>();
    totalCompletedCents = sumRow?.total ?? 0;

    const result = await db
      .prepare(
        `SELECT id, campaign_slug, provider, amount_cents, status,
                donor_name, donor_email, donor_fields, preset_id,
                created_at, completed_at
         FROM donations ${where}
         ORDER BY COALESCE(completed_at, created_at) DESC
         LIMIT ? OFFSET ?`,
      )
      .bind(...binds, PAGE_SIZE, offset)
      .all<DonationRow>();
    donations = result.results;
  } catch {
    // donations table may not exist until migration is applied
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    campaignFilter,
    campaigns,
    donations,
    page,
    statusFilter,
    total,
    totalCompletedCents,
    totalPages,
    user,
  };
}

function parseDonorFields(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export default function AdminDonations() {
  const {
    campaignFilter,
    campaigns,
    donations,
    page,
    statusFilter,
    total,
    totalCompletedCents,
    totalPages,
    user,
  } = useLoaderData<typeof loader>();

  const exportParams = new URLSearchParams();
  if (campaignFilter) exportParams.set('campaign', campaignFilter);
  if (statusFilter) exportParams.set('status', statusFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Donations Admin</h1>
            <p className="text-sm text-gray-500 mt-1">Signed in as {user.email}</p>
          </div>
          <nav className="flex flex-wrap gap-3 text-sm">
            <a
              className="text-indigo-600 hover:text-indigo-800 font-medium"
              href="/admin/reimbursements"
            >
              Reimbursements
            </a>
            <a
              className="text-indigo-600 hover:text-indigo-800 font-medium"
              href={`/api/admin/donations/export?${exportParams.toString()}`}
            >
              Export CSV
            </a>
            <a className="text-gray-500 hover:text-gray-700" href="/api/auth/logout">
              Log out
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Completed donations (filtered)</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatUsd(totalCompletedCents / 100)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total records (filtered)</p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </div>
        </div>

        <form
          action="/admin/donations"
          className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4 items-end"
          method="get"
        >
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="campaign">
              Campaign
            </label>
            <select
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              defaultValue={campaignFilter}
              id="campaign"
              name="campaign"
            >
              <option value="">All campaigns</option>
              {campaigns.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor="status">
              Status
            </label>
            <select
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              defaultValue={statusFilter}
              id="status"
              name="status"
            >
              <option value="">All statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <button
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            type="submit"
          >
            Filter
          </button>
        </form>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Campaign</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Donor</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {donations.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={6}>
                    No donations found.
                  </td>
                </tr>
              ) : (
                donations.map((row) => {
                  const fields = parseDonorFields(row.donor_fields);
                  const fieldSummary = Object.entries(fields)
                    .filter(([, v]) => v)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join('; ');
                  return (
                    <tr key={row.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        {(row.completed_at ?? row.created_at).slice(0, 10)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{row.campaign_slug}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{row.donor_name ?? '—'}</div>
                        <div className="text-gray-500 text-xs">{row.donor_email}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                        {formatUsd(row.amount_cents / 100)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            row.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : row.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                        {fieldSummary || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {page > 1 && (
              <a
                className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50"
                href={`?page=${page - 1}&campaign=${campaignFilter}&status=${statusFilter}`}
              >
                Previous
              </a>
            )}
            <span className="px-3 py-1 text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <a
                className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50"
                href={`?page=${page + 1}&campaign=${campaignFilter}&status=${statusFilter}`}
              >
                Next
              </a>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
