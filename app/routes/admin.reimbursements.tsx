import {useState} from 'react';
import {useLoaderData, useNavigate, useRevalidator} from 'react-router';
import {requireAdmin, type SessionPayload} from '~/lib/admin/auth';
import {mergeParentMeta} from '~/lib/meta';
import type {Route} from './+types/admin.reimbursements';

export function meta({matches}: Route.MetaArgs) {
  return mergeParentMeta(matches, [{title: 'Admin | Barton Hills Elementary PTA'}]);
}

const VALID_SORT_COLUMNS = [
  'submitted_at',
  'requester_name',
  'requester_email',
  'total_amount',
  'status',
  'updated_at',
] as const;

const VALID_ORDERS = ['asc', 'desc'] as const;

const VALID_STATUSES = ['pending', 'approved', 'check_delivered', 'rejected', 'needs_info'] as const;

interface Submission {
  id: number;
  requester_name: string;
  requester_email: string;
  total_amount: number;
  status: string;
  submitted_at: string;
  updated_at: string;
}

const PAGE_SIZE = 25;

export async function loader({request, context}: Route.LoaderArgs) {
  const auth = await requireAdmin(request, context.cloudflare.env);
  if (auth instanceof Response) return auth;
  const user: SessionPayload = auth;

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get('status') || '';
  const sort = url.searchParams.get('sort') || 'submitted_at';
  const order = url.searchParams.get('order') || 'desc';
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);

  // Validate sort column and order against allowlists
  const validSort = VALID_SORT_COLUMNS.includes(sort as (typeof VALID_SORT_COLUMNS)[number])
    ? sort
    : 'submitted_at';
  const validOrder = VALID_ORDERS.includes(order as (typeof VALID_ORDERS)[number]) ? order : 'desc';

  const db = context.cloudflare.env.REIMBURSEMENT_DB;
  const offset = (page - 1) * PAGE_SIZE;

  let submissions: Submission[];
  let totalCount: number;

  if (statusFilter && VALID_STATUSES.includes(statusFilter as (typeof VALID_STATUSES)[number])) {
    const [result, countResult] = await Promise.all([
      db
        .prepare(
          `SELECT id, requester_name, requester_email, total_amount, status, submitted_at, updated_at
           FROM submissions
           WHERE status = ?
           ORDER BY ${validSort} ${validOrder}
           LIMIT ? OFFSET ?`,
        )
        .bind(statusFilter, PAGE_SIZE, offset)
        .all<Submission>(),
      db
        .prepare('SELECT COUNT(*) as count FROM submissions WHERE status = ?')
        .bind(statusFilter)
        .first<{count: number}>(),
    ]);
    submissions = result.results;
    totalCount = countResult?.count ?? 0;
  } else {
    const [result, countResult] = await Promise.all([
      db
        .prepare(
          `SELECT id, requester_name, requester_email, total_amount, status, submitted_at, updated_at
           FROM submissions
           ORDER BY ${validSort} ${validOrder}
           LIMIT ? OFFSET ?`,
        )
        .bind(PAGE_SIZE, offset)
        .all<Submission>(),
      db.prepare('SELECT COUNT(*) as count FROM submissions').first<{count: number}>(),
    ]);
    submissions = result.results;
    totalCount = countResult?.count ?? 0;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return {
    submissions,
    user,
    filters: {status: statusFilter, sort: validSort, order: validOrder},
    pagination: {page, totalPages, totalCount},
  };
}

const STATUS_OPTIONS = [
  {value: '', label: 'All'},
  {value: 'pending', label: 'Pending'},
  {value: 'approved', label: 'Approved'},
  {value: 'check_delivered', label: 'Check Delivered'},
  {value: 'rejected', label: 'Rejected'},
  {value: 'needs_info', label: 'Needs Info'},
];

function StatusBadge({status}: {status: string}) {
  const styles: Record<string, string> = {
    approved: 'bg-creek-green/15 text-creek-green border-creek-green/30',
    check_delivered: 'bg-purple-100 text-purple-700 border-purple-300',
    pending: 'bg-spirit-gold/15 text-spirit-gold border-spirit-gold/30',
    rejected: 'bg-red-100 text-red-700 border-red-300',
    needs_info: 'bg-eagle-blue/10 text-eagle-blue border-eagle-blue/30',
  };

  const labels: Record<string, string> = {
    approved: 'Approved',
    check_delivered: 'Check Delivered',
    pending: 'Pending',
    rejected: 'Rejected',
    needs_info: 'Needs Info',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] ?? 'bg-gray-100 text-gray-700 border-gray-300'}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatAmount(amount: number): string {
  return `$${Number(amount).toFixed(2)}`;
}

export default function AdminReimbursements() {
  const {submissions, user, filters, pagination} = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const allSelected = submissions.length > 0 && selected.size === submissions.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(submissions.map((s) => String(s.id))));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkStatus = async (status: string, options?: {skipEmail?: boolean}) => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch('/api/admin/bulk-status', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ids: Array.from(selected), status, ...options}),
      });
      if (res.ok) {
        setSelected(new Set());
        revalidator.revalidate();
      }
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to delete ${selected.size} submission${selected.size !== 1 ? 's' : ''}? This cannot be undone.`,
      )
    )
      return;
    setBulkLoading(true);
    try {
      const res = await fetch('/api/admin/bulk-delete', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ids: Array.from(selected)}),
      });
      if (res.ok) {
        setSelected(new Set());
        revalidator.revalidate();
      }
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDownloadFiles = () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected).join(',');
    window.location.href = `/api/admin/bulk-download?ids=${encodeURIComponent(ids)}`;
  };

  const buildSearch = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = {status: filters.status, sort: filters.sort, order: filters.order, page: String(pagination.page), ...overrides};
    if (merged.status) params.set('status', merged.status);
    if (merged.sort !== 'submitted_at') params.set('sort', merged.sort);
    if (merged.order !== 'desc') params.set('order', merged.order);
    if (merged.page && merged.page !== '1') params.set('page', merged.page);
    const qs = params.toString();
    return qs ? `?${qs}` : '/admin';
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    navigate(buildSearch({status: e.target.value, page: '1'}));
  };

  return (
    <div className="min-h-screen bg-warm-white">
      {/* Admin Header */}
      <header className="bg-gradient-to-r from-eagle-blue to-night-blue shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-heading font-bold text-white">
            Reimbursement Admin
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/80 hidden sm:inline">{user.name}</span>
            <a
              className="text-sm text-white/70 hover:text-white underline underline-offset-2 transition-colors"
              href="/api/auth/logout"
            >
              Logout
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter Bar */}
        <div className="flex items-center gap-3 mb-6">
          <label className="text-sm font-medium text-charcoal font-body" htmlFor="status-filter">
            Status:
          </label>
          <select
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue font-body"
            id="status-filter"
            onChange={handleStatusChange}
            value={filters.status}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk Action Bar */}
        {selected.size > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-eagle-blue/5 border border-eagle-blue/20 px-4 py-3">
            <span className="text-sm font-medium text-charcoal font-body">
              {selected.size} selected
            </span>
            <div className="h-4 w-px bg-gray-300" />
            <button
              className="rounded-md bg-creek-green px-3 py-1.5 text-xs font-medium text-white hover:bg-creek-green/90 disabled:opacity-50 transition-colors"
              disabled={bulkLoading}
              onClick={() => handleBulkStatus('approved')}
            >
              Approve
            </button>
            <button
              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              disabled={bulkLoading}
              onClick={() => handleBulkStatus('rejected')}
            >
              Reject
            </button>
            <button
              className="rounded-md bg-eagle-blue px-3 py-1.5 text-xs font-medium text-white hover:bg-eagle-blue/90 disabled:opacity-50 transition-colors"
              disabled={bulkLoading}
              onClick={() => handleBulkStatus('needs_info')}
            >
              Needs Info
            </button>
            <button
              className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
              disabled={bulkLoading}
              onClick={() => handleBulkStatus('check_delivered')}
              title="Mark as check delivered and send notification email"
            >
              Check Delivered
            </button>
            <button
              className="rounded-md border border-purple-300 bg-white px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50 disabled:opacity-50 transition-colors"
              disabled={bulkLoading}
              onClick={() => handleBulkStatus('check_delivered', {skipEmail: true})}
              title="Mark as check delivered without sending email"
            >
              Check Delivered (no email)
            </button>
            <button
              className="rounded-md bg-spirit-gold px-3 py-1.5 text-xs font-medium text-charcoal hover:bg-spirit-gold/90 disabled:opacity-50 transition-colors"
              disabled={bulkLoading}
              onClick={handleDownloadFiles}
            >
              Download Files
            </button>
            <div className="h-4 w-px bg-gray-300" />
            <button
              className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
              disabled={bulkLoading}
              onClick={handleBulkDelete}
            >
              Delete
            </button>
            <button
              className="ml-auto text-xs text-gray-500 hover:text-charcoal transition-colors"
              onClick={() => setSelected(new Set())}
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Table Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {submissions.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-gray-500 font-body text-lg">No submissions found</p>
              {filters.status && (
                <p className="text-gray-400 font-body text-sm mt-1">
                  Try changing the status filter
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <caption className="sr-only">Reimbursement submissions</caption>
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="w-10 px-4 py-3" scope="col">
                      <input
                        aria-label="Select all submissions"
                        checked={allSelected}
                        className="h-4 w-4 rounded border-gray-300 text-eagle-blue focus:ring-eagle-blue"
                        onChange={toggleAll}
                        type="checkbox"
                      />
                    </th>
                    <th
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body"
                      scope="col"
                    >
                      Date
                    </th>
                    <th
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body"
                      scope="col"
                    >
                      Requester
                    </th>
                    <th
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body hidden md:table-cell"
                      scope="col"
                    >
                      Email
                    </th>
                    <th
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body text-right"
                      scope="col"
                    >
                      Amount
                    </th>
                    <th
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body"
                      scope="col"
                    >
                      Status
                    </th>
                    <th
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body text-right"
                      scope="col"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {submissions.map((sub) => (
                    <tr
                      className={`hover:bg-gray-50/50 transition-colors ${selected.has(String(sub.id)) ? 'bg-eagle-blue/5' : ''}`}
                      key={sub.id}
                    >
                      <td className="w-10 px-4 py-3">
                        <input
                          aria-label={`Select submission from ${sub.requester_name}`}
                          checked={selected.has(String(sub.id))}
                          className="h-4 w-4 rounded border-gray-300 text-eagle-blue focus:ring-eagle-blue"
                          onChange={() => toggleOne(String(sub.id))}
                          type="checkbox"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-charcoal font-body whitespace-nowrap">
                        {formatDate(sub.submitted_at)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-charcoal font-body">
                        {sub.requester_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-body hidden md:table-cell">
                        {sub.requester_email}
                      </td>
                      <td className="px-4 py-3 text-sm text-charcoal font-body text-right tabular-nums">
                        {formatAmount(sub.total_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          className="text-sm text-eagle-blue hover:text-eagle-blue/80 font-medium font-body transition-colors"
                          href={`/admin/reimbursements/${sub.id}`}
                        >
                          View<span className="sr-only"> submission from {sub.requester_name}</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalCount > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-400 font-body">
              {pagination.totalCount} submission{pagination.totalCount !== 1 ? 's' : ''}
              {pagination.totalPages > 1 && ` — page ${pagination.page} of ${pagination.totalPages}`}
            </p>
            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-1">
                <a
                  aria-disabled={pagination.page <= 1}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                    pagination.page <= 1
                      ? 'pointer-events-none border-gray-200 text-gray-300'
                      : 'border-gray-300 text-charcoal hover:bg-gray-50'
                  }`}
                  href={buildSearch({page: String(pagination.page - 1)})}
                >
                  Previous
                </a>
                <a
                  aria-disabled={pagination.page >= pagination.totalPages}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                    pagination.page >= pagination.totalPages
                      ? 'pointer-events-none border-gray-200 text-gray-300'
                      : 'border-gray-300 text-charcoal hover:bg-gray-50'
                  }`}
                  href={buildSearch({page: String(pagination.page + 1)})}
                >
                  Next
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
