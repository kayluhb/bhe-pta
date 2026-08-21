import {type ReactNode, useEffect, useState} from 'react';
import {useLoaderData, useNavigate, useRevalidator} from 'react-router';
import {requireAdmin, type SessionPayload} from '~/lib/admin/auth';
import {
  ADMIN_SUBMISSION_STATUS_LABELS,
  ADMIN_SUBMISSION_STATUSES,
  isAdminSubmissionStatus,
} from '~/lib/admin/reimbursement-submission-statuses';
import {submissionSearchCondition} from '~/lib/admin/submission-search-sql';
import {getCloudflare} from '~/lib/cloudflare-context';
import {formatUsd} from '~/lib/format-currency';
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

interface Submission {
  check_number: string | null;
  id: string;
  requester_email: string;
  requester_name: string;
  school_year_id: string;
  school_year_label: string | null;
  status: string;
  submitted_at: string;
  total_amount: number;
  updated_at: string;
}

interface StatusAggRow {
  count: number;
  status: string;
  sum_amount: number;
}

interface SubmissionStats {
  grandAmount: number;
  grandCount: number;
  other: null | {amount: number; count: number; statuses: string[]};
  perStatus: {amount: number; count: number; status: (typeof ADMIN_SUBMISSION_STATUSES)[number]}[];
}

const PAGE_SIZE = 25;
const LARGE_DOWNLOAD_WARNING_THRESHOLD = 4;
const BULK_CHECK_DELIVERED_NO_EMAIL = 'check_delivered__no_email';

interface SnapshotRow {
  approved_cnt: number | null;
  check_delivered_cnt: number | null;
  check_deposited_cnt: number | null;
  check_written_cnt: number | null;
  in_pipeline_amount: number | null;
  new_last_30d: number | null;
  new_last_7d: number | null;
  oldest_pending_at: string | null;
  pending_amount: number | null;
  pending_cnt: number | null;
  rejected_cnt: number | null;
  sum_total_requested: number | null;
  total_submissions: number | null;
  uncashed_amount: number | null;
}

export async function loader({request, context}: Route.LoaderArgs) {
  const auth = await requireAdmin(request, getCloudflare(context).env);
  if (auth instanceof Response) return auth;
  const user: SessionPayload = auth;

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get('status') || '';
  const schoolYearParam = url.searchParams.get('schoolYear') || '';
  const qRaw = url.searchParams.get('q') ?? '';
  const sort = url.searchParams.get('sort') || 'submitted_at';
  const order = url.searchParams.get('order') || 'desc';
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);

  // Validate sort column and order against allowlists
  const validSort = VALID_SORT_COLUMNS.includes(sort as (typeof VALID_SORT_COLUMNS)[number])
    ? sort
    : 'submitted_at';
  const validOrder = VALID_ORDERS.includes(order as (typeof VALID_ORDERS)[number]) ? order : 'desc';

  const db = getCloudflare(context).env.REIMBURSEMENT_DB;
  const offset = (page - 1) * PAGE_SIZE;

  const schoolYearsResult = await db
    .prepare(
      'SELECT id, label, is_default FROM school_years ORDER BY sort_order DESC, starts_on DESC',
    )
    .all<{id: string; is_default: number; label: string}>();
  const schoolYears = schoolYearsResult.results;
  const schoolYearIds = new Set(schoolYears.map((r) => r.id));
  // Pre-select the default (current) school year when no filter is in the URL.
  // Use the 'all' sentinel so the user can still explicitly opt out of the year filter.
  const defaultYearId = schoolYears.find((y) => y.is_default === 1)?.id ?? schoolYears[0]?.id ?? '';
  let selectedSchoolYear: string;
  if (schoolYearParam === 'all') {
    selectedSchoolYear = 'all';
  } else if (schoolYearParam && schoolYearIds.has(schoolYearParam)) {
    selectedSchoolYear = schoolYearParam;
  } else {
    selectedSchoolYear = defaultYearId || 'all';
  }
  const schoolYearFilter = selectedSchoolYear === 'all' ? '' : selectedSchoolYear;

  const baseWhereParts: string[] = [];
  const baseWhereBinds: (string | number)[] = [];
  if (schoolYearFilter) {
    baseWhereParts.push('s.school_year_id = ?');
    baseWhereBinds.push(schoolYearFilter);
  }
  const search = submissionSearchCondition(qRaw, 's');
  if (search.sql) {
    baseWhereParts.push(search.sql);
    baseWhereBinds.push(...search.binds);
  }
  const baseWhereClause = baseWhereParts.length > 0 ? `WHERE ${baseWhereParts.join(' AND ')}` : '';

  const whereParts = [...baseWhereParts];
  const whereBinds = [...baseWhereBinds];
  if (statusFilter && isAdminSubmissionStatus(statusFilter)) {
    whereParts.unshift('s.status = ?');
    whereBinds.unshift(statusFilter);
  }
  const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

  const snapshotSql = `SELECT
       COUNT(*) AS total_submissions,
       COALESCE(SUM(s.total_amount), 0) AS sum_total_requested,
       SUM(CASE WHEN s.status = 'pending' THEN 1 ELSE 0 END) AS pending_cnt,
       SUM(CASE WHEN s.status = 'approved' THEN 1 ELSE 0 END) AS approved_cnt,
       SUM(CASE WHEN s.status = 'check_written' THEN 1 ELSE 0 END) AS check_written_cnt,
       SUM(CASE WHEN s.status = 'check_delivered' THEN 1 ELSE 0 END) AS check_delivered_cnt,
       SUM(CASE WHEN s.status = 'check_deposited' THEN 1 ELSE 0 END) AS check_deposited_cnt,
       SUM(CASE WHEN s.status = 'rejected' THEN 1 ELSE 0 END) AS rejected_cnt,
       SUM(CASE WHEN s.status IN ('check_written', 'check_delivered') THEN COALESCE(s.check_amount, s.total_amount) ELSE 0 END) AS uncashed_amount,
       SUM(CASE WHEN s.status = 'pending' THEN s.total_amount ELSE 0 END) AS pending_amount,
       SUM(CASE WHEN s.status IN ('approved', 'check_written', 'check_delivered') THEN s.total_amount ELSE 0 END) AS in_pipeline_amount,
       SUM(CASE WHEN s.submitted_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) AS new_last_7d,
       SUM(CASE WHEN s.submitted_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) AS new_last_30d,
       MIN(CASE WHEN s.status = 'pending' THEN s.submitted_at END) AS oldest_pending_at
     FROM submissions s
     ${whereClause}`;

  const snapshotStmt = db.prepare(snapshotSql);
  const snapshotPromise =
    whereBinds.length > 0
      ? snapshotStmt.bind(...whereBinds).first<SnapshotRow>()
      : snapshotStmt.first<SnapshotRow>();

  const listSql = `SELECT s.id, s.requester_name, s.requester_email, s.total_amount, s.status, s.submitted_at, s.updated_at,
       s.school_year_id, y.label AS school_year_label, s.check_number
     FROM submissions s
     LEFT JOIN school_years y ON y.id = s.school_year_id
     ${whereClause}
     ORDER BY s.${validSort} ${validOrder}
     LIMIT ? OFFSET ?`;

  const countSql = `SELECT COUNT(*) as count FROM submissions s ${whereClause}`;

  const aggSql = `SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as sum_amount
     FROM submissions s
     ${whereClause}
     GROUP BY status`;
  const aggStmt = db.prepare(aggSql);
  const aggPromise =
    whereBinds.length > 0
      ? aggStmt.bind(...whereBinds).all<StatusAggRow>()
      : aggStmt.all<StatusAggRow>();

  const dropdownAggSql = `SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as sum_amount
     FROM submissions s
     ${baseWhereClause}
     GROUP BY status`;
  const dropdownAggStmt = db.prepare(dropdownAggSql);
  const dropdownAggPromise =
    baseWhereBinds.length > 0
      ? dropdownAggStmt.bind(...baseWhereBinds).all<StatusAggRow>()
      : dropdownAggStmt.all<StatusAggRow>();

  const [listBundle, snapshotRow, aggResult, dropdownAggResult] = await Promise.all([
    Promise.all([
      db
        .prepare(listSql)
        .bind(...whereBinds, PAGE_SIZE, offset)
        .all<Submission>(),
      db
        .prepare(countSql)
        .bind(...whereBinds)
        .first<{count: number}>(),
    ]),
    snapshotPromise,
    aggPromise,
    dropdownAggPromise,
  ]);

  const [result, countResult] = listBundle;
  const submissions = result.results;
  const totalCount = countResult?.count ?? 0;

  const stats = buildSubmissionStatsFromAggRows(aggResult.results);
  const dropdownStats = buildSubmissionStatsFromAggRows(dropdownAggResult.results);

  const snap = snapshotRow ?? ({} as SnapshotRow);
  const writtenCount = Number(snap.check_written_cnt ?? 0) || 0;
  const deliveredCount = Number(snap.check_delivered_cnt ?? 0) || 0;
  const uncashedStats = {
    deliveredCount,
    totalAmount: Number(snap.uncashed_amount ?? 0) || 0,
    totalCount: writtenCount + deliveredCount,
    writtenCount,
  };

  const snapshot = {
    approvedCount: Number(snap.approved_cnt ?? 0) || 0,
    checkDepositedCount: Number(snap.check_deposited_cnt ?? 0) || 0,
    inPipelineAmount: Number(snap.in_pipeline_amount ?? 0) || 0,
    newLast30d: Number(snap.new_last_30d ?? 0) || 0,
    newLast7d: Number(snap.new_last_7d ?? 0) || 0,
    oldestPendingAt: snap.oldest_pending_at?.trim() || null,
    pendingAmount: Number(snap.pending_amount ?? 0) || 0,
    pendingCount: Number(snap.pending_cnt ?? 0) || 0,
    rejectedCount: Number(snap.rejected_cnt ?? 0) || 0,
    sumTotalRequested: Number(snap.sum_total_requested ?? 0) || 0,
    totalSubmissions: Number(snap.total_submissions ?? 0) || 0,
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return {
    filters: {
      order: validOrder,
      q: qRaw.trim(),
      schoolYear: selectedSchoolYear,
      sort: validSort,
      status: statusFilter,
    },
    dropdownStats,
    pagination: {page, totalPages, totalCount},
    schoolYears,
    snapshot,
    stats,
    submissions,
    uncashedStats,
    user,
  };
}

function buildSubmissionStatsFromAggRows(aggRows: StatusAggRow[]): SubmissionStats {
  const byStatus = new Map<string, {count: number; sum_amount: number}>();
  let grandCount = 0;
  let grandAmount = 0;
  for (const row of aggRows) {
    const sumAmount = Number(row.sum_amount);
    byStatus.set(row.status, {count: row.count, sum_amount: sumAmount});
    grandCount += row.count;
    grandAmount += sumAmount;
  }
  const perStatus = ADMIN_SUBMISSION_STATUSES.map((status) => {
    const row = byStatus.get(status);
    return {amount: row?.sum_amount ?? 0, count: row?.count ?? 0, status};
  });
  const unknownAgg = aggRows.filter((r) => !isAdminSubmissionStatus(r.status));
  const other: SubmissionStats['other'] =
    unknownAgg.length === 0
      ? null
      : {
          amount: unknownAgg.reduce((s, r) => s + Number(r.sum_amount), 0),
          count: unknownAgg.reduce((s, r) => s + r.count, 0),
          statuses: [...new Set(unknownAgg.map((r) => r.status))],
        };
  return {grandAmount, grandCount, other, perStatus};
}

function buildBulkStatusApplyOptions(): {label: string; value: string}[] {
  const out: {label: string; value: string}[] = [];
  for (const s of ADMIN_SUBMISSION_STATUSES) {
    if (s === 'check_delivered') {
      out.push(
        {
          label: `${ADMIN_SUBMISSION_STATUS_LABELS.check_delivered} (send email)`,
          value: 'check_delivered',
        },
        {
          label: `${ADMIN_SUBMISSION_STATUS_LABELS.check_delivered} (no email)`,
          value: BULK_CHECK_DELIVERED_NO_EMAIL,
        },
      );
    } else {
      out.push({label: ADMIN_SUBMISSION_STATUS_LABELS[s], value: s});
    }
  }
  return out;
}

const BULK_STATUS_APPLY_OPTIONS = buildBulkStatusApplyOptions();

function statusFilterSelectOptions(stats: SubmissionStats): {label: string; value: string}[] {
  return [
    {label: `All (${stats.grandCount})`, value: ''},
    ...stats.perStatus.map(({count, status}) => ({
      label: `${ADMIN_SUBMISSION_STATUS_LABELS[status]} (${count})`,
      value: status,
    })),
  ];
}

function StatusBadge({status}: {status: string}) {
  const styles: Record<string, string> = {
    approved: 'bg-creek-green/15 text-creek-green border-creek-green/30',
    check_deposited: 'bg-slate-100 text-slate-700 border-slate-300',
    check_delivered: 'bg-purple-100 text-purple-700 border-purple-300',
    check_written: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    pending: 'bg-spirit-gold/15 text-spirit-gold border-spirit-gold/30',
    rejected: 'bg-red-100 text-red-700 border-red-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] ?? 'bg-gray-100 text-gray-700 border-gray-300'}`}
    >
      {isAdminSubmissionStatus(status) ? ADMIN_SUBMISSION_STATUS_LABELS[status] : status}
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

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

interface R2OrphanRow {
  key: string;
  size: number;
  uploaded: string | null;
}

function KpiTile({
  href,
  label,
  sublabel,
  value,
}: {
  href?: string;
  label: string;
  sublabel?: string;
  value: ReactNode;
}) {
  const inner = (
    <>
      <p className="text-xs font-medium text-gray-500 font-body">{label}</p>
      <p className="mt-1 text-2xl font-heading font-bold tabular-nums text-charcoal">{value}</p>
      {sublabel ? <p className="mt-0.5 text-xs text-gray-400 font-body">{sublabel}</p> : null}
    </>
  );
  const className =
    'rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors font-body' +
    (href ? ' hover:border-eagle-blue/40 hover:bg-eagle-blue/[0.03]' : '');

  if (href) {
    return (
      <a className={className} href={href}>
        {inner}
      </a>
    );
  }
  return <div className={className}>{inner}</div>;
}

export default function AdminReimbursements() {
  const {
    dropdownStats,
    filters,
    pagination,
    schoolYears,
    snapshot,
    stats,
    submissions,
    uncashedStats,
    user,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkStatusChoice, setBulkStatusChoice] = useState('');
  const [r2CleanupOpen, setR2CleanupOpen] = useState(false);
  const [r2DeleteLoading, setR2DeleteLoading] = useState(false);
  const [r2Error, setR2Error] = useState<string | null>(null);
  const [r2Orphans, setR2Orphans] = useState<R2OrphanRow[]>([]);
  const [r2ScanLoading, setR2ScanLoading] = useState(false);
  const [r2SelectedKeys, setR2SelectedKeys] = useState<Set<string>>(new Set());
  const [r2ScanWarning, setR2ScanWarning] = useState<string | null>(null);

  const allSelected = submissions.length > 0 && selected.size === submissions.length;

  useEffect(() => {
    if (selected.size === 0) setBulkStatusChoice('');
  }, [selected.size]);

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
        setBulkStatusChoice('');
        setSelected(new Set());
        revalidator.revalidate();
      }
    } finally {
      setBulkLoading(false);
    }
  };

  const applyBulkStatus = () => {
    if (selected.size === 0 || !bulkStatusChoice) return;
    if (bulkStatusChoice === BULK_CHECK_DELIVERED_NO_EMAIL) {
      void handleBulkStatus('check_delivered', {skipEmail: true});
    } else {
      void handleBulkStatus(bulkStatusChoice);
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
    const merged = {
      order: filters.order,
      page: String(pagination.page),
      q: filters.q,
      schoolYear: filters.schoolYear,
      sort: filters.sort,
      status: filters.status,
      ...overrides,
    };
    if (merged.status) params.set('status', merged.status);
    if (merged.schoolYear) params.set('schoolYear', merged.schoolYear);
    if (merged.sort !== 'submitted_at') params.set('sort', merged.sort);
    if (merged.order !== 'desc') params.set('order', merged.order);
    if (merged.page && merged.page !== '1') params.set('page', merged.page);
    if (merged.q) params.set('q', merged.q);
    const qs = params.toString();
    return qs ? `?${qs}` : '/admin';
  };

  const handleSchoolYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    navigate(buildSearch({page: '1', schoolYear: e.target.value}));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    navigate(buildSearch({page: '1', status: e.target.value}));
  };

  const closeR2Cleanup = () => {
    if (r2DeleteLoading || r2ScanLoading) return;
    setR2CleanupOpen(false);
    setR2Error(null);
    setR2Orphans([]);
    setR2SelectedKeys(new Set());
    setR2ScanWarning(null);
  };

  const scanR2Orphans = async () => {
    setR2ScanLoading(true);
    setR2Error(null);
    setR2ScanWarning(null);
    setR2SelectedKeys(new Set());
    try {
      const res = await fetch('/api/admin/reimbursements/r2-cleanup');
      const data = (await res.json()) as {
        count?: number;
        error?: string;
        listIncomplete?: boolean;
        listWarning?: string;
        orphaned?: R2OrphanRow[];
      };
      if (!res.ok) {
        setR2Error(data.error || 'Scan failed');
        setR2Orphans([]);
        setR2ScanWarning(null);
        return;
      }
      setR2Orphans(data.orphaned ?? []);
      setR2ScanWarning(
        data.listIncomplete
          ? (data.listWarning ??
              'Listing stopped before every object was scanned. Some unused objects may be missing; try again after deleting found orphans, or check Worker/subrequest limits for very large buckets.')
          : null,
      );
    } catch {
      setR2Error('Network error while scanning');
      setR2Orphans([]);
    } finally {
      setR2ScanLoading(false);
    }
  };

  const toggleR2Key = (key: string) => {
    setR2SelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAllR2Orphans = () => {
    if (r2Orphans.length === 0) return;
    const allSelected = r2SelectedKeys.size === r2Orphans.length;
    if (allSelected) setR2SelectedKeys(new Set());
    else setR2SelectedKeys(new Set(r2Orphans.map((o) => o.key)));
  };

  const deleteSelectedR2Orphans = async () => {
    if (r2SelectedKeys.size === 0) return;
    if (
      !window.confirm(
        `Permanently delete ${r2SelectedKeys.size} object${r2SelectedKeys.size !== 1 ? 's' : ''} from R2? This cannot be undone.`,
      )
    )
      return;
    setR2DeleteLoading(true);
    setR2Error(null);
    try {
      const res = await fetch('/api/admin/reimbursements/r2-cleanup', {
        body: JSON.stringify({keys: Array.from(r2SelectedKeys)}),
        headers: {'Content-Type': 'application/json'},
        method: 'POST',
      });
      const data = (await res.json()) as {deleted?: number; error?: string; rejected?: number};
      if (!res.ok) {
        setR2Error(data.error || 'Delete failed');
        return;
      }
      setR2SelectedKeys(new Set());
      await scanR2Orphans();
    } catch {
      setR2Error('Network error while deleting');
    } finally {
      setR2DeleteLoading(false);
    }
  };

  const r2AllOrphansSelected = r2Orphans.length > 0 && r2SelectedKeys.size === r2Orphans.length;

  return (
    <div className="min-h-screen bg-warm-white">
      {/* Admin Header */}
      <header className="bg-gradient-to-r from-eagle-blue to-night-blue shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-heading font-bold text-white">
            Reimbursement Admin
          </h1>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <a
              className="text-sm font-body text-white/90 hover:text-white underline underline-offset-2 transition-colors"
              href="/admin/reimbursements/paper"
            >
              Add paper
            </a>
            <a
              className="text-sm font-body text-white/90 hover:text-white underline underline-offset-2 transition-colors"
              href="/admin/school-years"
            >
              School years
            </a>
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
        {/* Dashboard snapshot KPIs (same scope as the table: school year, status, search) */}
        <section
          aria-labelledby="snapshot-heading"
          className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wide text-gray-600 font-body"
            id="snapshot-heading"
          >
            Snapshot
          </h2>
          <p className="mt-1 text-xs text-gray-500 font-body max-w-3xl mb-4">
            Volume and pipeline for the same rows as the table below:{' '}
            <strong className="font-medium">school year</strong>,{' '}
            <strong className="font-medium">status</strong>, and{' '}
            <strong className="font-medium">search</strong> filters all apply.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <KpiTile label="Submissions" sublabel="In scope" value={snapshot.totalSubmissions} />
            <KpiTile
              label="Total requested"
              sublabel="Sum of claim totals"
              value={formatUsd(snapshot.sumTotalRequested)}
            />
            <KpiTile
              href={buildSearch({page: '1', status: 'pending'})}
              label="Pending"
              sublabel={formatUsd(snapshot.pendingAmount)}
              value={snapshot.pendingCount}
            />
            <KpiTile
              href={buildSearch({page: '1', status: 'approved'})}
              label="Approved"
              value={snapshot.approvedCount}
            />
            <KpiTile
              href={buildSearch({page: '1', status: 'check_deposited'})}
              label="Deposited"
              value={snapshot.checkDepositedCount}
            />
            <KpiTile
              href={buildSearch({page: '1', status: 'rejected'})}
              label="Rejected"
              value={snapshot.rejectedCount}
            />
            <KpiTile
              label="In pipeline $"
              sublabel="Approved + uncashed"
              value={formatUsd(snapshot.inPipelineAmount)}
            />
            <KpiTile label="New (7 days)" sublabel="By submit date" value={snapshot.newLast7d} />
            <KpiTile label="New (30 days)" sublabel="By submit date" value={snapshot.newLast30d} />
            <KpiTile
              label="Oldest pending"
              sublabel="Submitted"
              value={
                snapshot.oldestPendingAt ? (
                  formatDate(snapshot.oldestPendingAt)
                ) : (
                  <span className="text-gray-400">—</span>
                )
              }
            />
          </div>
        </section>

        {/* Outstanding uncashed checks */}
        <section
          aria-labelledby="uncashed-stats-heading"
          className="mb-6 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-purple-50/50 p-5 shadow-sm"
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wide text-indigo-900/80 font-body"
            id="uncashed-stats-heading"
          >
            Outstanding uncashed checks
          </h2>
          <p className="mt-1 text-xs text-indigo-900/60 font-body max-w-2xl">
            Submissions in <strong className="font-medium">Check written</strong> or{' '}
            <strong className="font-medium">Check delivered</strong> (not yet{' '}
            <strong className="font-medium">Check deposited</strong>). Dollar total uses the
            treasurer check amount when set, otherwise the submission total. Open items and amounts
            use the same <strong className="font-medium">school year</strong>,{' '}
            <strong className="font-medium">status</strong>, and{' '}
            <strong className="font-medium">search</strong> filters as the table.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-6 sm:gap-10">
            <div>
              <p className="text-xs font-medium text-indigo-900/70 font-body">Open items</p>
              <p className="mt-0.5 text-3xl font-heading font-bold tabular-nums text-indigo-950">
                {uncashedStats.totalCount}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-indigo-900/70 font-body">Combined amount</p>
              <p className="mt-0.5 text-3xl font-heading font-bold tabular-nums text-indigo-950">
                {formatUsd(uncashedStats.totalAmount)}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-body border-t border-indigo-200/60 pt-3 sm:border-t-0 sm:border-l sm:pl-8 sm:pt-0 w-full sm:w-auto">
              <a
                className="text-indigo-800 hover:text-indigo-950 underline underline-offset-2"
                href={buildSearch({status: 'check_written', page: '1'})}
              >
                Check written: {uncashedStats.writtenCount}
              </a>
              <a
                className="text-purple-900 hover:text-purple-950 underline underline-offset-2"
                href={buildSearch({status: 'check_delivered', page: '1'})}
              >
                Check delivered (uncashed): {uncashedStats.deliveredCount}
              </a>
            </div>
          </div>
        </section>

        {/* Filter Bar */}
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <label
              className="text-sm font-medium text-charcoal font-body"
              htmlFor="school-year-filter"
            >
              School year:
            </label>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue font-body"
              id="school-year-filter"
              onChange={handleSchoolYearChange}
              value={filters.schoolYear}
            >
              <option value="all">All years</option>
              {schoolYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                </option>
              ))}
            </select>
            <label className="text-sm font-medium text-charcoal font-body" htmlFor="status-filter">
              Status:
            </label>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue font-body"
              id="status-filter"
              onChange={handleStatusChange}
              value={filters.status}
            >
              {statusFilterSelectOptions(dropdownStats).map((opt) => (
                <option key={opt.value === '' ? 'all' : opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-charcoal shadow-sm hover:bg-gray-50 font-body transition-colors"
              onClick={() => {
                setR2CleanupOpen(true);
                setR2Error(null);
                setR2Orphans([]);
                setR2SelectedKeys(new Set());
              }}
              type="button"
            >
              Unused R2 files…
            </button>
          </div>
          <form
            className="flex w-full min-w-0 max-w-4xl flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const next = String(fd.get('q') ?? '').trim();
              navigate(buildSearch({page: '1', q: next || undefined}));
            }}
          >
            <label className="sr-only" htmlFor="admin-reimb-search">
              Search by requester name, email, check number, or submission ID
            </label>
            <input
              autoComplete="off"
              className="min-h-[2.5rem] min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-charcoal shadow-sm placeholder:text-gray-400 focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue font-body"
              defaultValue={filters.q}
              id="admin-reimb-search"
              key={filters.q}
              name="q"
              placeholder="Search name, email, check #, or submission ID"
              type="search"
            />
            <button
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-charcoal shadow-sm hover:bg-gray-50 font-body transition-colors"
              type="submit"
            >
              Search
            </button>
            {filters.q ? (
              <button
                className="text-sm text-eagle-blue hover:text-eagle-blue/80 font-medium font-body underline-offset-2 hover:underline"
                onClick={() => navigate(buildSearch({page: '1', q: undefined}))}
                type="button"
              >
                Clear
              </button>
            ) : null}
          </form>
        </div>

        <section aria-labelledby="submission-stats-heading" className="mb-6">
          <h2
            className="text-sm font-semibold text-charcoal font-heading mb-2"
            id="submission-stats-heading"
          >
            Totals by status
          </h2>
          <p className="text-xs text-gray-500 font-body mb-3">
            Counts and amounts match the table: school year, status, and search filters apply. Use
            the status dropdown for counts across all statuses (still scoped by school year and
            search).
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              className={`block min-w-[6.5rem] rounded-lg border px-3 py-2 text-left shadow-sm transition-colors font-body ${
                filters.status === ''
                  ? 'border-eagle-blue bg-eagle-blue/5 ring-2 ring-eagle-blue/40'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
              href={buildSearch({page: '1', status: ''})}
            >
              <div className="text-xs font-medium text-gray-500">All</div>
              <div className="text-lg font-semibold text-charcoal tabular-nums">
                {stats.grandCount}
              </div>
              <div className="text-xs text-gray-600 tabular-nums">
                {formatUsd(stats.grandAmount)}
              </div>
            </a>
            {stats.perStatus.map(({amount, count, status}) => (
              <a
                className={`block min-w-[6.5rem] max-w-[10rem] rounded-lg border px-3 py-2 text-left shadow-sm transition-colors font-body ${
                  filters.status === status
                    ? 'border-eagle-blue bg-eagle-blue/5 ring-2 ring-eagle-blue/40'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
                href={buildSearch({page: '1', status})}
                key={status}
                title={ADMIN_SUBMISSION_STATUS_LABELS[status]}
              >
                <div className="text-xs font-medium text-gray-500 truncate">
                  {ADMIN_SUBMISSION_STATUS_LABELS[status]}
                </div>
                <div className="text-lg font-semibold text-charcoal tabular-nums">{count}</div>
                <div className="text-xs text-gray-600 tabular-nums">{formatUsd(amount)}</div>
              </a>
            ))}
            {stats.other ? (
              <div
                className="block min-w-[6.5rem] max-w-[12rem] rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-left shadow-sm font-body"
                title={stats.other.statuses.join(', ')}
              >
                <div className="text-xs font-medium text-amber-900/80">Other status</div>
                <div className="text-lg font-semibold text-charcoal tabular-nums">
                  {stats.other.count}
                </div>
                <div className="text-xs text-gray-700 tabular-nums">
                  {formatUsd(stats.other.amount)}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* Bulk Action Bar */}
        {selected.size > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-eagle-blue/5 border border-eagle-blue/20 px-4 py-3">
            <span className="text-sm font-medium text-charcoal font-body">
              {selected.size} selected
            </span>
            <div className="h-4 w-px bg-gray-300" />
            <label
              className="text-sm font-medium text-charcoal font-body"
              htmlFor="bulk-status-select"
            >
              Set status:
            </label>
            <select
              className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue font-body max-w-[16rem]"
              disabled={bulkLoading}
              id="bulk-status-select"
              onChange={(e) => setBulkStatusChoice(e.target.value)}
              value={bulkStatusChoice}
            >
              <option value="">Choose status…</option>
              {BULK_STATUS_APPLY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              className="rounded-md bg-eagle-blue px-3 py-1.5 text-xs font-medium text-white hover:bg-eagle-blue/90 disabled:opacity-50 transition-colors"
              disabled={bulkLoading || !bulkStatusChoice}
              onClick={applyBulkStatus}
              type="button"
            >
              Apply
            </button>
            <button
              className="rounded-md bg-spirit-gold px-3 py-1.5 text-xs font-medium text-charcoal hover:bg-spirit-gold/90 disabled:opacity-50 transition-colors"
              disabled={bulkLoading}
              onClick={handleDownloadFiles}
              type="button"
            >
              Download Files
            </button>
            {selected.size >= LARGE_DOWNLOAD_WARNING_THRESHOLD && (
              <span className="text-xs text-charcoal/80 font-body">
                Large batch: ZIP is uncompressed to avoid CPU limit errors, so download size may be
                bigger.
              </span>
            )}
            <div className="h-4 w-px bg-gray-300" />
            <button
              className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
              disabled={bulkLoading}
              onClick={handleBulkDelete}
              type="button"
            >
              Delete
            </button>
            <button
              className="ml-auto text-xs text-gray-500 hover:text-charcoal transition-colors"
              onClick={() => setSelected(new Set())}
              type="button"
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
              {(filters.status || filters.q) && (
                <p className="text-gray-400 font-body text-sm mt-1">
                  {filters.q && filters.status
                    ? 'Try a different search or status filter'
                    : filters.q
                      ? 'Try a different search term'
                      : 'Try changing the status filter'}
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
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body hidden md:table-cell text-right"
                      scope="col"
                    >
                      Check #
                    </th>
                    <th
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body hidden lg:table-cell"
                      scope="col"
                    >
                      School year
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
                        {formatUsd(sub.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-charcoal font-body hidden md:table-cell text-right tabular-nums whitespace-nowrap">
                        {sub.check_number?.trim() ? sub.check_number.trim() : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-body hidden lg:table-cell whitespace-nowrap">
                        {sub.school_year_label ?? sub.school_year_id}
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
              {pagination.totalPages > 1 &&
                ` — page ${pagination.page} of ${pagination.totalPages}`}
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

      {r2CleanupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Close dialog"
            className="absolute inset-0 bg-charcoal/40"
            disabled={r2DeleteLoading || r2ScanLoading}
            onClick={closeR2Cleanup}
            type="button"
          />
          <div
            aria-labelledby="r2-cleanup-title"
            aria-modal="true"
            className="relative z-10 max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl border border-gray-200 flex flex-col"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
              <div>
                <h2
                  className="text-lg font-heading font-semibold text-charcoal"
                  id="r2-cleanup-title"
                >
                  Unused R2 objects
                </h2>
                <p className="mt-1 text-sm text-gray-600 font-body">
                  Lists objects under{' '}
                  <code className="text-xs bg-gray-100 px-1 rounded">uploads/</code> and{' '}
                  <code className="text-xs bg-gray-100 px-1 rounded">submissions/</code> that are
                  not linked from the database (submission PDFs or file attachments). Abandoned
                  uploads and orphaned files after DB changes appear here.
                </p>
              </div>
              <button
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-charcoal"
                disabled={r2DeleteLoading || r2ScanLoading}
                onClick={closeR2Cleanup}
                type="button"
              >
                <span className="sr-only">Close</span>
                <span aria-hidden>×</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-5 py-3 bg-gray-50/80">
              <button
                className="rounded-md bg-eagle-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-eagle-blue/90 disabled:opacity-50 font-body"
                disabled={r2ScanLoading || r2DeleteLoading}
                onClick={scanR2Orphans}
                type="button"
              >
                {r2ScanLoading ? 'Scanning…' : 'Scan bucket'}
              </button>
              <button
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 font-body"
                disabled={r2SelectedKeys.size === 0 || r2DeleteLoading || r2ScanLoading}
                onClick={deleteSelectedR2Orphans}
                type="button"
              >
                {r2DeleteLoading ? 'Deleting…' : `Delete selected (${r2SelectedKeys.size})`}
              </button>
            </div>

            <div className="flex-1 overflow-auto px-5 py-3">
              {r2Error && (
                <p className="mb-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800 font-body">
                  {r2Error}
                </p>
              )}
              {r2ScanWarning && (
                <p className="mb-3 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-950 font-body">
                  {r2ScanWarning}
                </p>
              )}
              {r2Orphans.length === 0 && !r2ScanLoading && (
                <p className="text-sm text-gray-500 font-body">
                  {r2Error
                    ? ''
                    : 'Run a scan to find objects that are not referenced by any submission.'}
                </p>
              )}
              {r2Orphans.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-left text-sm">
                    <caption className="sr-only">Orphaned R2 objects</caption>
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/50">
                        <th className="w-10 px-3 py-2" scope="col">
                          <input
                            aria-label="Select all orphaned objects"
                            checked={r2AllOrphansSelected}
                            className="h-4 w-4 rounded border-gray-300 text-eagle-blue focus:ring-eagle-blue"
                            onChange={toggleAllR2Orphans}
                            type="checkbox"
                          />
                        </th>
                        <th
                          className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body"
                          scope="col"
                        >
                          Key
                        </th>
                        <th
                          className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body whitespace-nowrap"
                          scope="col"
                        >
                          Size
                        </th>
                        <th
                          className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body whitespace-nowrap hidden sm:table-cell"
                          scope="col"
                        >
                          Uploaded
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono text-xs">
                      {r2Orphans.map((row) => (
                        <tr className="hover:bg-gray-50/50" key={row.key}>
                          <td className="px-3 py-2">
                            <input
                              aria-label={`Select ${row.key}`}
                              checked={r2SelectedKeys.has(row.key)}
                              className="h-4 w-4 rounded border-gray-300 text-eagle-blue focus:ring-eagle-blue"
                              onChange={() => toggleR2Key(row.key)}
                              type="checkbox"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <a
                              aria-label={`View file ${row.key} in new tab`}
                              className="break-all font-mono text-eagle-blue hover:text-eagle-blue/80 underline-offset-2 hover:underline"
                              href={`/api/admin/reimbursements/file?key=${encodeURIComponent(row.key)}`}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              {row.key}
                            </a>
                          </td>
                          <td className="px-3 py-2 text-charcoal tabular-nums whitespace-nowrap">
                            {formatBytes(row.size)}
                          </td>
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap hidden sm:table-cell">
                            {row.uploaded
                              ? new Date(row.uploaded).toLocaleString('en-US', {
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {r2Orphans.length > 0 && (
                <p className="mt-2 text-xs text-gray-500 font-body">
                  {r2Orphans.length} unused object{r2Orphans.length !== 1 ? 's' : ''} found. Only
                  selected rows are deleted.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
