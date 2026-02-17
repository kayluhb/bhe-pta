import type { Route } from "./+types/admin.reimbursements";
import { useLoaderData, useNavigate } from "react-router";
import { requireAdmin, type SessionPayload } from "~/lib/admin/auth";

export function meta() {
  return [{ title: "Admin | Barton Hills Elementary PTA" }];
}

const VALID_SORT_COLUMNS = [
  "submitted_at",
  "requester_name",
  "requester_email",
  "total_amount",
  "status",
  "updated_at",
] as const;

const VALID_ORDERS = ["asc", "desc"] as const;

const VALID_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "needs_info",
] as const;

interface Submission {
  id: number;
  requester_name: string;
  requester_email: string;
  total_amount: number;
  status: string;
  submitted_at: string;
  updated_at: string;
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const auth = await requireAdmin(request, context.cloudflare.env);
  if (auth instanceof Response) return auth;
  const user: SessionPayload = auth;

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status") || "";
  const sort = url.searchParams.get("sort") || "submitted_at";
  const order = url.searchParams.get("order") || "desc";

  // Validate sort column and order against allowlists
  const validSort = VALID_SORT_COLUMNS.includes(
    sort as (typeof VALID_SORT_COLUMNS)[number]
  )
    ? sort
    : "submitted_at";
  const validOrder = VALID_ORDERS.includes(
    order as (typeof VALID_ORDERS)[number]
  )
    ? order
    : "desc";

  const db = context.cloudflare.env.REIMBURSEMENT_DB;

  let submissions: Submission[];

  if (
    statusFilter &&
    VALID_STATUSES.includes(statusFilter as (typeof VALID_STATUSES)[number])
  ) {
    const result = await db
      .prepare(
        `SELECT id, requester_name, requester_email, total_amount, status, submitted_at, updated_at
         FROM submissions
         WHERE status = ?
         ORDER BY ${validSort} ${validOrder}`
      )
      .bind(statusFilter)
      .all<Submission>();
    submissions = result.results;
  } else {
    const result = await db
      .prepare(
        `SELECT id, requester_name, requester_email, total_amount, status, submitted_at, updated_at
         FROM submissions
         ORDER BY ${validSort} ${validOrder}`
      )
      .all<Submission>();
    submissions = result.results;
  }

  return {
    submissions,
    user,
    filters: { status: statusFilter, sort: validSort, order: validOrder },
  };
}

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "needs_info", label: "Needs Info" },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: "bg-creek-green/15 text-creek-green border-creek-green/30",
    pending: "bg-spirit-gold/15 text-spirit-gold border-spirit-gold/30",
    rejected: "bg-red-100 text-red-700 border-red-300",
    needs_info: "bg-eagle-blue/10 text-eagle-blue border-eagle-blue/30",
  };

  const labels: Record<string, string> = {
    approved: "Approved",
    pending: "Pending",
    rejected: "Rejected",
    needs_info: "Needs Info",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] ?? "bg-gray-100 text-gray-700 border-gray-300"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatAmount(amount: number): string {
  return `$${Number(amount).toFixed(2)}`;
}

export default function AdminReimbursements() {
  const { submissions, user, filters } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams();
    if (e.target.value) params.set("status", e.target.value);
    if (filters.sort !== "submitted_at") params.set("sort", filters.sort);
    if (filters.order !== "desc") params.set("order", filters.order);
    const qs = params.toString();
    navigate(qs ? `?${qs}` : ".");
  };

  const exportUrl = filters.status
    ? `/api/admin/reimbursements/export?status=${filters.status}`
    : "/api/admin/reimbursements/export";

  return (
    <div className="min-h-screen bg-warm-white">
      {/* Admin Header */}
      <header className="bg-gradient-to-r from-eagle-blue to-night-blue shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-heading font-bold text-white">
            Reimbursement Admin
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/80 hidden sm:inline">
              {user.name}
            </span>
            <a
              href="/api/auth/logout"
              className="text-sm text-white/70 hover:text-white underline underline-offset-2 transition-colors"
            >
              Logout
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <label
              htmlFor="status-filter"
              className="text-sm font-medium text-charcoal font-body"
            >
              Status:
            </label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={handleStatusChange}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue font-body"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <a
            href={exportUrl}
            className="inline-flex items-center gap-2 rounded-lg bg-eagle-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-eagle-blue/90 transition-colors font-body"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export CSV
          </a>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {submissions.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-gray-500 font-body text-lg">
                No submissions found
              </p>
              {filters.status && (
                <p className="text-gray-400 font-body text-sm mt-1">
                  Try changing the status filter
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body">
                      Date
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body">
                      Requester
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body hidden md:table-cell">
                      Email
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body text-right">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {submissions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
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
                          href={`/admin/reimbursements/${sub.id}`}
                          className="text-sm text-eagle-blue hover:text-eagle-blue/80 font-medium font-body transition-colors"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Count */}
        {submissions.length > 0 && (
          <p className="mt-3 text-sm text-gray-400 font-body">
            {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
          </p>
        )}
      </main>
    </div>
  );
}
