import {useState} from 'react';
import {useLoaderData} from 'react-router';
import {requireAdmin, type SessionPayload} from '~/lib/admin/auth';
import type {Route} from './+types/admin.reimbursement-detail';

export function meta() {
  return [{title: 'Submission Details | Admin'}];
}

interface Submission {
  id: number;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  status: string;
  total_amount: number;
  pdf_key: string | null;
  submitted_at: string;
  updated_at: string;
  admin_notes: string | null;
}

interface ReceiptEntry {
  id: number;
  submission_id: number;
  receipt_date: string;
  description: string;
  amount: number;
  category: string | null;
  vendor: string | null;
  sort_order: number;
}

interface FileAttachment {
  id: number;
  submission_id: number;
  r2_key: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  sort_order: number;
}

export async function loader({request, params, context}: Route.LoaderArgs) {
  const auth = await requireAdmin(request, context.cloudflare.env);
  if (auth instanceof Response) return auth;
  const user: SessionPayload = auth;

  const id = params.id;
  const db = context.cloudflare.env.REIMBURSEMENT_DB;

  const results = await db.batch([
    db.prepare('SELECT * FROM submissions WHERE id = ?').bind(id),
    db
      .prepare('SELECT * FROM receipt_entries WHERE submission_id = ? ORDER BY sort_order')
      .bind(id),
    db
      .prepare('SELECT * FROM file_attachments WHERE submission_id = ? ORDER BY sort_order')
      .bind(id),
  ]);

  const submission = results[0].results[0] as Submission | undefined;
  if (!submission) {
    throw new Response('Not Found', {status: 404});
  }

  const receipts = results[1].results as ReceiptEntry[];
  const files = results[2].results as FileAttachment[];

  return {submission, receipts, files, user};
}

function StatusBadge({status}: {status: string}) {
  const styles: Record<string, string> = {
    approved: 'bg-creek-green/15 text-creek-green border-creek-green/30',
    pending: 'bg-spirit-gold/15 text-spirit-gold border-spirit-gold/30',
    rejected: 'bg-red-100 text-red-700 border-red-300',
    needs_info: 'bg-eagle-blue/10 text-eagle-blue border-eagle-blue/30',
  };

  const labels: Record<string, string> = {
    approved: 'Approved',
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminReimbursementDetail() {
  const {submission, receipts, files, user} = useLoaderData<typeof loader>();
  const [status, setStatus] = useState(submission.status);
  const [notes, setNotes] = useState(submission.admin_notes ?? '');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleStatusUpdate = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/reimbursements/${submission.id}/status`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({status, notes}),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to update status');
      }
      setFeedback({type: 'success', message: 'Status updated successfully.'});
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'An unknown error occurred.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this submission?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/reimbursements/${submission.id}/delete`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to delete submission');
      }
      window.location.href = '/admin/reimbursements';
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete submission.');
      setDeleting(false);
    }
  };

  const receiptsTotal = receipts.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="min-h-screen bg-warm-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-eagle-blue to-night-blue shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-heading font-bold text-white">
            Submission Details
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/80 hidden sm:inline">{user.name}</span>
            <a
              href="/api/auth/logout"
              className="text-sm text-white/70 hover:text-white underline underline-offset-2 transition-colors"
            >
              Logout
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Back link + ID + Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <a
              href="/admin/reimbursements"
              className="text-sm text-eagle-blue hover:text-eagle-blue/80 font-medium font-body transition-colors"
            >
              &larr; Back to list
            </a>
            <span className="text-sm text-gray-400 font-body">ID: #{submission.id}</span>
          </div>
          <StatusBadge status={submission.status} />
        </div>

        {/* Submission Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-heading font-semibold text-charcoal mb-4">Submission Info</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm font-body">
            <div>
              <dt className="text-gray-500">Requester Name</dt>
              <dd className="text-charcoal font-medium">{submission.requester_name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd className="text-charcoal font-medium">{submission.requester_email}</dd>
            </div>
            {submission.requester_phone && (
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="text-charcoal font-medium">{submission.requester_phone}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500">Submitted</dt>
              <dd className="text-charcoal font-medium">{formatDate(submission.submitted_at)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Total Amount</dt>
              <dd className="text-charcoal font-semibold text-base">
                {formatAmount(submission.total_amount)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Status Update Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-heading font-semibold text-charcoal mb-4">Update Status</h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="status-select"
                className="block text-sm font-medium text-charcoal font-body mb-1"
              >
                Status
              </label>
              <select
                id="status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue font-body w-full sm:w-auto"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="needs_info">Needs Info</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="admin-notes"
                className="block text-sm font-medium text-charcoal font-body mb-1"
              >
                Admin Notes
              </label>
              <textarea
                id="admin-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue font-body"
                placeholder="Optional notes..."
              />
            </div>
            {feedback && (
              <div
                className={`text-sm font-body px-3 py-2 rounded-lg ${
                  feedback.type === 'success'
                    ? 'bg-creek-green/10 text-creek-green'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {feedback.message}
              </div>
            )}
            <button
              type="button"
              onClick={handleStatusUpdate}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-eagle-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-eagle-blue/90 transition-colors font-body disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Receipt Entries Table */}
        {receipts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 pt-6 pb-3">
              <h2 className="text-lg font-heading font-semibold text-charcoal">Receipt Entries</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body">
                      Date
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body">
                      Description
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body">
                      Vendor
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body">
                      Budget Account
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body text-right">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {receipts.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-charcoal font-body whitespace-nowrap">
                        {formatDate(r.receipt_date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-charcoal font-body">{r.description}</td>
                      <td className="px-4 py-3 text-sm text-charcoal font-body">
                        {r.vendor ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-charcoal font-body">
                        {r.category ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-charcoal font-body text-right tabular-nums">
                        {formatAmount(r.amount)}
                      </td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="bg-gray-50/50 font-semibold">
                    <td
                      colSpan={4}
                      className="px-4 py-3 text-sm text-charcoal font-body text-right"
                    >
                      Total
                    </td>
                    <td className="px-4 py-3 text-sm text-charcoal font-body text-right tabular-nums">
                      {formatAmount(receiptsTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* File Attachments */}
        {(files.length > 0 || submission.pdf_key) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-heading font-semibold text-charcoal mb-4">
              File Attachments
            </h2>

            {submission.pdf_key && (
              <div className="mb-4">
                <a
                  href={`/api/admin/reimbursements/file?key=${encodeURIComponent(submission.pdf_key)}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-eagle-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-eagle-blue/90 transition-colors font-body"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download PDF
                </a>
              </div>
            )}

            {files.length > 0 && (
              <ul className="divide-y divide-gray-100">
                {files.map((f) => (
                  <li key={f.id} className="flex items-center justify-between py-3 gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-charcoal font-body truncate">
                        {f.original_filename}
                      </p>
                      <p className="text-xs text-gray-500 font-body">
                        {f.content_type} &middot; {formatFileSize(f.file_size)}
                      </p>
                    </div>
                    <a
                      href={`/api/admin/reimbursements/file?key=${encodeURIComponent(f.r2_key)}`}
                      className="text-sm text-eagle-blue hover:text-eagle-blue/80 font-medium font-body transition-colors whitespace-nowrap"
                    >
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Delete Section */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
          <h2 className="text-lg font-heading font-semibold text-red-700 mb-2">Danger Zone</h2>
          <p className="text-sm text-gray-600 font-body mb-4">
            Permanently delete this submission and all associated data. This action cannot be
            undone.
          </p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors font-body disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete Submission'}
          </button>
        </div>
      </main>
    </div>
  );
}
