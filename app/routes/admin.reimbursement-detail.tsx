import {useEffect, useState} from 'react';
import {useLoaderData, useRevalidator} from 'react-router';
import {requireAdmin, type SessionPayload} from '~/lib/admin/auth';
import {
  ADMIN_SUBMISSION_STATUS_LABELS,
  ADMIN_SUBMISSION_STATUSES,
  isAdminSubmissionStatus,
} from '~/lib/admin/reimbursement-submission-statuses';
import {blurNumberInputOnWheel} from '~/lib/blur-number-input-on-wheel';
import {getCloudflare} from '~/lib/cloudflare-context';
import {formatUsd} from '~/lib/format-currency';
import {mergeParentMeta} from '~/lib/meta';
import type {Route} from './+types/admin.reimbursement-detail';

export function meta({matches}: Route.MetaArgs) {
  return mergeParentMeta(matches, [{title: 'Submission Details | Admin'}]);
}

interface SchoolYearOption {
  id: string;
  label: string;
}

interface Submission {
  id: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  school_year_id: string;
  school_year_label: string | null;
  status: string;
  total_amount: number;
  pdf_key: string | null;
  submitted_at: string;
  updated_at: string;
  admin_notes: string | null;
  check_amount: number | null;
  check_number: string | null;
  date_approved?: string | null;
  date_paid?: string | null;
}

interface ReceiptEntry {
  id: string;
  submission_id: string;
  receipt_date: string;
  description: string;
  amount: number;
  category: string | null;
  vendor: string | null;
  sort_order: number;
}

interface FileAttachment {
  id: string;
  submission_id: string;
  r2_key: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  sort_order: number;
}

export async function loader({request, params, context}: Route.LoaderArgs) {
  const env = getCloudflare(context).env;
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;
  const user: SessionPayload = auth;

  const id = params.id;
  const db = env.REIMBURSEMENT_DB;

  const results = await db.batch([
    db
      .prepare(
        `SELECT s.*, y.label AS school_year_label
         FROM submissions s
         LEFT JOIN school_years y ON y.id = s.school_year_id
         WHERE s.id = ?`,
      )
      .bind(id),
    db
      .prepare('SELECT * FROM receipt_entries WHERE submission_id = ? ORDER BY sort_order')
      .bind(id),
    db
      .prepare('SELECT * FROM file_attachments WHERE submission_id = ? ORDER BY sort_order')
      .bind(id),
    db.prepare('SELECT id, label FROM school_years ORDER BY sort_order DESC, starts_on DESC'),
  ]);

  const submission = results[0].results[0] as Submission | undefined;
  if (!submission) {
    throw new Response('Not Found', {status: 404});
  }

  const receipts = results[1].results as ReceiptEntry[];
  const files = results[2].results as FileAttachment[];
  const schoolYears = results[3].results as SchoolYearOption[];

  return {files, receipts, schoolYears, submission, user};
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isoDateForInput(value: string | null | undefined): string {
  if (value == null || !String(value).trim()) return '';
  const t = String(value).trim();
  return t.length >= 10 ? t.slice(0, 10) : t;
}

function checkAmountInputFromDb(value: number | null): string {
  if (value == null || Number.isNaN(Number(value))) return '';
  return String(value);
}

export default function AdminReimbursementDetail() {
  const {files, receipts, schoolYears, submission, user} = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const [status, setStatus] = useState(submission.status);
  const [notes, setNotes] = useState(submission.admin_notes ?? '');
  const [requesterName, setRequesterName] = useState(submission.requester_name);
  const [requesterEmail, setRequesterEmail] = useState(submission.requester_email);
  const [requesterPhone, setRequesterPhone] = useState(submission.requester_phone ?? '');
  const [saving, setSaving] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [contactFeedback, setContactFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [skipEmail, setSkipEmail] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingLineId, setRemovingLineId] = useState<string | null>(null);
  const [removingAttachmentId, setRemovingAttachmentId] = useState<string | null>(null);
  const [regeneratingPdf, setRegeneratingPdf] = useState(false);
  const [removingPdf, setRemovingPdf] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [convertingAttachmentId, setConvertingAttachmentId] = useState<string | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [nudgeFeedback, setNudgeFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [nudgeSending, setNudgeSending] = useState(false);
  const [checkAmountInput, setCheckAmountInput] = useState(() =>
    checkAmountInputFromDb(submission.check_amount),
  );
  const [checkNumber, setCheckNumber] = useState(submission.check_number ?? '');
  const [datePaid, setDatePaid] = useState(() => isoDateForInput(submission.date_paid));
  const [savingTreasurer, setSavingTreasurer] = useState(false);
  const [treasurerFeedback, setTreasurerFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [schoolYearId, setSchoolYearId] = useState(submission.school_year_id);
  const [savingSchoolYear, setSavingSchoolYear] = useState(false);
  const [schoolYearFeedback, setSchoolYearFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    setRequesterName(submission.requester_name);
    setRequesterEmail(submission.requester_email);
    setRequesterPhone(submission.requester_phone ?? '');
  }, [submission.requester_name, submission.requester_email, submission.requester_phone]);

  useEffect(() => {
    setCheckAmountInput(checkAmountInputFromDb(submission.check_amount));
    setCheckNumber(submission.check_number ?? '');
    setDatePaid(isoDateForInput(submission.date_paid));
  }, [submission.check_amount, submission.check_number, submission.date_paid]);

  useEffect(() => {
    setSchoolYearId(submission.school_year_id);
  }, [submission.school_year_id]);

  const handleSchoolYearSave = async () => {
    setSavingSchoolYear(true);
    setSchoolYearFeedback(null);
    try {
      const res = await fetch(
        `/api/admin/reimbursements/${encodeURIComponent(submission.id)}/school-year`,
        {
          body: JSON.stringify({school_year_id: schoolYearId}),
          headers: {'Content-Type': 'application/json'},
          method: 'POST',
        },
      );
      const data = (await res.json().catch(() => ({}))) as {error?: string};
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update school year');
      }
      setSchoolYearFeedback({type: 'success', message: 'School year updated.'});
      revalidator.revalidate();
    } catch (err) {
      setSchoolYearFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update school year.',
      });
    } finally {
      setSavingSchoolYear(false);
    }
  };

  const handleContactSave = async () => {
    setSavingContact(true);
    setContactFeedback(null);
    try {
      const res = await fetch(
        `/api/admin/reimbursements/${encodeURIComponent(submission.id)}/contact`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            requester_name: requesterName,
            requester_email: requesterEmail,
            requester_phone: requesterPhone.trim() === '' ? null : requesterPhone.trim(),
          }),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {error?: string};
        throw new Error(data.error || (await res.text()) || 'Failed to save contact info');
      }
      setContactFeedback({type: 'success', message: 'Contact info saved.'});
      revalidator.revalidate();
    } catch (err) {
      setContactFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'An unknown error occurred.',
      });
    } finally {
      setSavingContact(false);
    }
  };

  const handleTreasurerSave = async () => {
    setSavingTreasurer(true);
    setTreasurerFeedback(null);
    let check_amount: number | null = null;
    if (checkAmountInput.trim() !== '') {
      const n = Number(checkAmountInput);
      if (Number.isNaN(n) || n < 0) {
        setTreasurerFeedback({
          type: 'error',
          message: 'Check amount must be a valid non-negative number.',
        });
        setSavingTreasurer(false);
        return;
      }
      check_amount = n;
    }
    try {
      const res = await fetch(
        `/api/admin/reimbursements/${encodeURIComponent(submission.id)}/treasurer-fields`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            check_amount,
            check_number: checkNumber.trim() === '' ? null : checkNumber.trim(),
            date_paid: datePaid.trim() === '' ? null : datePaid.trim(),
          }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        pdfRegenerated?: boolean;
        success?: boolean;
        warning?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || (await res.text()) || 'Failed to save');
      }
      setTreasurerFeedback({
        type: 'success',
        message: data.warning
          ? data.warning
          : data.pdfRegenerated
            ? 'Check details saved and the request PDF was updated.'
            : 'Check details saved.',
      });
      revalidator.revalidate();
    } catch (err) {
      setTreasurerFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'An unknown error occurred.',
      });
    } finally {
      setSavingTreasurer(false);
    }
  };

  const handleRemoveLineItem = async (receiptId: string) => {
    if (
      !window.confirm(
        'Remove this line item? The submission total will be recalculated. This cannot be undone.',
      )
    ) {
      return;
    }
    setRemovingLineId(receiptId);
    try {
      const res = await fetch(
        `/api/admin/reimbursements/${encodeURIComponent(submission.id)}/receipts/${encodeURIComponent(receiptId)}`,
        {method: 'DELETE'},
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {error?: string};
        throw new Error(data.error || 'Failed to remove line item');
      }
      revalidator.revalidate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove line item.');
    } finally {
      setRemovingLineId(null);
    }
  };

  const attachmentBusy =
    convertingAttachmentId !== null ||
    removingAttachmentId !== null ||
    removingPdf ||
    regeneratingPdf;

  const handleRemoveAttachment = async (attachmentId: string, filename: string) => {
    if (
      !window.confirm(
        `Remove attachment "${filename}"? The file will be deleted from storage. This cannot be undone.`,
      )
    ) {
      return;
    }
    setRemovingAttachmentId(attachmentId);
    try {
      const res = await fetch(
        `/api/admin/reimbursements/${encodeURIComponent(submission.id)}/attachments/${encodeURIComponent(attachmentId)}`,
        {method: 'DELETE'},
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {error?: string};
        throw new Error(data.error || 'Failed to remove attachment');
      }
      revalidator.revalidate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove attachment.');
    } finally {
      setRemovingAttachmentId(null);
    }
  };

  const handleConvertAttachment = async (attachmentId: string, filename: string) => {
    setConvertingAttachmentId(attachmentId);
    setUploadFeedback(null);
    try {
      const res = await fetch(
        `/api/admin/reimbursements/${encodeURIComponent(submission.id)}/attachments/${encodeURIComponent(attachmentId)}/convert`,
        {method: 'POST'},
      );
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        existingFilename?: string;
        skipped?: boolean;
      };
      if (!res.ok) {
        throw new Error(data.error || 'Failed to convert attachment');
      }
      setUploadFeedback({
        type: 'success',
        message: data.skipped
          ? `A converted PDF already exists (${data.existingFilename ?? 'existing file'}).`
          : `Converted ${filename} to an AI PDF and added it to attachments.`,
      });
      revalidator.revalidate();
    } catch (err) {
      setUploadFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to convert attachment.',
      });
    } finally {
      setConvertingAttachmentId(null);
    }
  };

  const handleRegeneratePdf = async () => {
    setRegeneratingPdf(true);
    try {
      const res = await fetch(
        `/api/admin/reimbursements/${encodeURIComponent(submission.id)}/pdf/regenerate`,
        {method: 'POST'},
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {error?: string};
        throw new Error(data.error || 'Failed to regenerate PDF');
      }
      revalidator.revalidate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to regenerate PDF.');
    } finally {
      setRegeneratingPdf(false);
    }
  };

  const handleRemovePdf = async () => {
    if (
      !window.confirm(
        'Remove the submission PDF? The file will be deleted from storage. This cannot be undone.',
      )
    ) {
      return;
    }
    setRemovingPdf(true);
    try {
      const res = await fetch(
        `/api/admin/reimbursements/${encodeURIComponent(submission.id)}/pdf`,
        {method: 'DELETE'},
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {error?: string};
        throw new Error(data.error || 'Failed to remove PDF');
      }
      revalidator.revalidate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove PDF.');
    } finally {
      setRemovingPdf(false);
    }
  };

  const handleCashCheckNudge = async () => {
    setNudgeSending(true);
    setNudgeFeedback(null);
    try {
      const res = await fetch(
        `/api/admin/reimbursements/${encodeURIComponent(submission.id)}/cash-check-nudge`,
        {method: 'POST'},
      );
      const data = (await res.json().catch(() => ({}))) as {error?: string};
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reminder');
      }
      setNudgeFeedback({type: 'success', message: 'Reminder email sent.'});
    } catch (err) {
      setNudgeFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to send reminder.',
      });
    } finally {
      setNudgeSending(false);
    }
  };

  const handleStatusUpdate = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(
        `/api/admin/reimbursements/${encodeURIComponent(submission.id)}/status`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({status, notes, ...(skipEmail && {skipEmail: true})}),
        },
      );
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
      const res = await fetch(
        `/api/admin/reimbursements/${encodeURIComponent(submission.id)}/delete`,
        {
          method: 'DELETE',
        },
      );
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadFeedback(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(
        `/api/admin/reimbursements/${encodeURIComponent(submission.id)}/upload`,
        {
          method: 'POST',
          body: formData,
        },
      );
      if (!res.ok) {
        const data = (await res.json()) as {error?: string};
        throw new Error(data.error || 'Upload failed');
      }
      setUploadFeedback({type: 'success', message: `Uploaded ${file.name} successfully.`});
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setUploadFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Upload failed.',
      });
    } finally {
      setUploading(false);
      e.target.value = '';
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
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
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

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Back link + ID + Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <a
              className="text-sm text-eagle-blue hover:text-eagle-blue/80 font-medium font-body transition-colors"
              href="/admin/reimbursements"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm font-body">
            <div className="sm:col-span-2">
              <label
                className="block text-sm font-medium text-charcoal font-body mb-1"
                htmlFor="school-year-select"
              >
                School year
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  className="min-w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue font-body"
                  id="school-year-select"
                  onChange={(e) => setSchoolYearId(e.target.value)}
                  value={schoolYearId}
                >
                  {schoolYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.label}
                    </option>
                  ))}
                </select>
                <button
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-charcoal shadow-sm hover:bg-gray-50 font-body disabled:opacity-50"
                  disabled={savingSchoolYear || schoolYearId === submission.school_year_id}
                  onClick={handleSchoolYearSave}
                  type="button"
                >
                  {savingSchoolYear ? 'Saving…' : 'Save school year'}
                </button>
              </div>
              {schoolYearFeedback && (
                <p
                  className={`mt-2 text-sm font-body ${
                    schoolYearFeedback.type === 'success' ? 'text-creek-green' : 'text-red-600'
                  }`}
                  role="status"
                >
                  {schoolYearFeedback.message}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label
                className="block text-sm font-medium text-charcoal font-body mb-1"
                htmlFor="requester-name"
              >
                Requester name
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue font-body"
                id="requester-name"
                onChange={(e) => setRequesterName(e.target.value)}
                type="text"
                value={requesterName}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-charcoal font-body mb-1"
                htmlFor="requester-email"
              >
                Email
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue font-body"
                id="requester-email"
                onChange={(e) => setRequesterEmail(e.target.value)}
                type="email"
                value={requesterEmail}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-charcoal font-body mb-1"
                htmlFor="requester-phone"
              >
                Phone
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue font-body"
                id="requester-phone"
                onChange={(e) => setRequesterPhone(e.target.value)}
                type="tel"
                value={requesterPhone}
              />
            </div>
            <div>
              <p className="text-gray-500 mb-1">Submitted</p>
              <p className="text-charcoal font-medium">{formatDate(submission.submitted_at)}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Total amount</p>
              <p className="text-charcoal font-semibold text-base">
                {formatUsd(submission.total_amount)}
              </p>
            </div>
            {contactFeedback && (
              <div
                className={`sm:col-span-2 text-sm font-body px-3 py-2 rounded-lg ${
                  contactFeedback.type === 'success'
                    ? 'bg-creek-green/10 text-creek-green'
                    : 'bg-red-50 text-red-700'
                }`}
                role="alert"
              >
                {contactFeedback.message}
              </div>
            )}
            <div className="sm:col-span-2">
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-eagle-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-eagle-blue/90 transition-colors font-body disabled:opacity-50"
                disabled={savingContact}
                onClick={handleContactSave}
                type="button"
              >
                {savingContact ? 'Saving...' : 'Save contact info'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-heading font-semibold text-charcoal mb-4">
            Check &amp; treasurer
          </h2>
          <p className="text-sm text-gray-600 font-body mb-4">
            On the PDF, <strong className="font-medium text-charcoal">Date received</strong> is the
            submission date. <strong className="font-medium text-charcoal">Date approved</strong> is
            set automatically when you save status as Approved (including from the list bulk
            action). Saving check details below updates the stored request PDF automatically.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm font-body">
            <div>
              <p className="text-sm font-medium text-charcoal font-body mb-1">Date approved</p>
              <p className="text-charcoal rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2">
                {submission.date_approved?.trim()
                  ? formatDate(submission.date_approved)
                  : '— Saved automatically when status becomes Approved.'}
              </p>
            </div>
            <div>
              <label
                className="block text-sm font-medium text-charcoal font-body mb-1"
                htmlFor="treasurer-date-paid"
              >
                Date paid
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue font-body"
                id="treasurer-date-paid"
                onChange={(e) => setDatePaid(e.target.value)}
                type="date"
                value={datePaid}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-charcoal font-body mb-1"
                htmlFor="treasurer-check-number"
              >
                Check number
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue font-body"
                id="treasurer-check-number"
                onChange={(e) => setCheckNumber(e.target.value)}
                type="text"
                value={checkNumber}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-charcoal font-body mb-1"
                htmlFor="treasurer-check-amount"
              >
                Amount on check
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue font-body"
                id="treasurer-check-amount"
                min={0}
                onChange={(e) => setCheckAmountInput(e.target.value)}
                onWheel={blurNumberInputOnWheel}
                step="0.01"
                type="number"
                value={checkAmountInput}
              />
            </div>
            {treasurerFeedback && (
              <div
                className={`sm:col-span-2 text-sm font-body px-3 py-2 rounded-lg ${
                  treasurerFeedback.type === 'success'
                    ? 'bg-creek-green/10 text-creek-green'
                    : 'bg-red-50 text-red-700'
                }`}
                role="alert"
              >
                {treasurerFeedback.message}
              </div>
            )}
            <div className="sm:col-span-2">
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-eagle-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-eagle-blue/90 transition-colors font-body disabled:opacity-50"
                disabled={savingTreasurer}
                onClick={handleTreasurerSave}
                type="button"
              >
                {savingTreasurer ? 'Saving...' : 'Save check details'}
              </button>
            </div>
          </div>
        </div>

        {/* Status Update Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-heading font-semibold text-charcoal mb-4">Update Status</h2>
          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium text-charcoal font-body mb-1"
                htmlFor="status-select"
              >
                Status
              </label>
              <select
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue font-body w-full sm:w-auto"
                id="status-select"
                onChange={(e) => setStatus(e.target.value)}
                value={status}
              >
                {ADMIN_SUBMISSION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ADMIN_SUBMISSION_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            {status === 'check_delivered' && (
              <label className="flex items-center gap-2 text-sm font-body text-charcoal">
                <input
                  checked={skipEmail}
                  className="h-4 w-4 rounded border-gray-300 text-eagle-blue focus:ring-eagle-blue"
                  onChange={(e) => setSkipEmail(e.target.checked)}
                  type="checkbox"
                />
                Don&apos;t send notification email
              </label>
            )}
            {submission.status === 'check_delivered' && (
              <div className="rounded-lg border border-purple-200 bg-purple-50/40 p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-charcoal font-body">Cash check reminder</p>
                  <p className="text-sm text-gray-600 font-body mt-1">
                    Sends a polite email to the requester asking them to cash or deposit their check
                    when they can. Same tone as the treasurer notifications; includes the amount and
                    a note about picking up from the front office if needed.
                  </p>
                </div>
                {nudgeFeedback && (
                  <div
                    className={`text-sm font-body px-3 py-2 rounded-lg ${
                      nudgeFeedback.type === 'success'
                        ? 'bg-creek-green/10 text-creek-green'
                        : 'bg-red-50 text-red-700'
                    }`}
                    role="alert"
                  >
                    {nudgeFeedback.message}
                  </div>
                )}
                <button
                  className="inline-flex items-center gap-2 rounded-lg border border-purple-300 bg-white px-4 py-2 text-sm font-medium text-purple-900 shadow-sm hover:bg-purple-50 transition-colors font-body disabled:opacity-50"
                  disabled={nudgeSending}
                  onClick={handleCashCheckNudge}
                  type="button"
                >
                  {nudgeSending ? 'Sending…' : 'Send reminder email'}
                </button>
              </div>
            )}
            <div>
              <label
                className="block text-sm font-medium text-charcoal font-body mb-1"
                htmlFor="admin-notes"
              >
                Admin Notes
              </label>
              <textarea
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue font-body"
                id="admin-notes"
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                rows={3}
                value={notes}
              />
            </div>
            {feedback && (
              <div
                className={`text-sm font-body px-3 py-2 rounded-lg ${
                  feedback.type === 'success'
                    ? 'bg-creek-green/10 text-creek-green'
                    : 'bg-red-50 text-red-700'
                }`}
                role="alert"
              >
                {feedback.message}
              </div>
            )}
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-eagle-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-eagle-blue/90 transition-colors font-body disabled:opacity-50"
              disabled={saving}
              onClick={handleStatusUpdate}
              type="button"
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
                <caption className="sr-only">Receipt entries</caption>
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
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
                      Description
                    </th>
                    <th
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body"
                      scope="col"
                    >
                      Vendor
                    </th>
                    <th
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body"
                      scope="col"
                    >
                      Budget Account
                    </th>
                    <th
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body text-right"
                      scope="col"
                    >
                      Amount
                    </th>
                    <th
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 font-body text-right w-28"
                      scope="col"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {receipts.map((r) => (
                    <tr className="hover:bg-gray-50/50 transition-colors" key={r.id}>
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
                        {formatUsd(r.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <button
                          className="text-red-600 hover:text-red-700 font-medium font-body disabled:opacity-50"
                          disabled={removingLineId !== null || attachmentBusy}
                          onClick={() => handleRemoveLineItem(r.id)}
                          type="button"
                        >
                          {removingLineId === r.id ? 'Removing…' : 'Remove'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="bg-gray-50/50 font-semibold">
                    <td
                      className="px-4 py-3 text-sm text-charcoal font-body text-right"
                      colSpan={4}
                    >
                      Total
                    </td>
                    <td className="px-4 py-3 text-sm text-charcoal font-body text-right tabular-nums">
                      {formatUsd(receiptsTotal)}
                    </td>
                    <td className="px-4 py-3" />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* File Attachments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-heading font-semibold text-charcoal mb-4">
            File Attachments
          </h2>

          <div className="mb-4">
            <p className="text-sm text-gray-500 font-body mb-2">Check request PDF</p>
            <div className="flex flex-wrap items-center gap-3">
              {submission.pdf_key ? (
                <>
                  <a
                    className="inline-flex items-center gap-2 rounded-lg bg-eagle-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-eagle-blue/90 transition-colors font-body"
                    href={`/api/admin/reimbursements/file?key=${encodeURIComponent(submission.pdf_key)}&download=1`}
                  >
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                      />
                    </svg>
                    Download PDF
                  </a>
                  <button
                    className="text-sm text-red-600 hover:text-red-700 font-medium font-body disabled:opacity-50"
                    disabled={attachmentBusy || removingLineId !== null}
                    onClick={handleRemovePdf}
                    type="button"
                  >
                    {removingPdf ? 'Removing…' : 'Remove PDF'}
                  </button>
                </>
              ) : (
                <p className="text-sm text-charcoal/80 font-body">No PDF on file.</p>
              )}
              <button
                className="text-sm text-eagle-blue hover:text-eagle-blue/80 font-medium font-body disabled:opacity-50"
                disabled={attachmentBusy || removingLineId !== null}
                onClick={handleRegeneratePdf}
                type="button"
              >
                {regeneratingPdf ? 'Regenerating…' : 'Regenerate PDF'}
              </button>
            </div>
            <p className="text-xs text-gray-500 font-body mt-2 max-w-xl">
              Rebuilds the check-request PDF from the submission and line items in the database.
              Address and some original form fields are not stored and show as — in the PDF.
            </p>
          </div>

          {files.length > 0 && (
            <ul className="divide-y divide-gray-100 mb-4">
              {files.map((f) => (
                <li className="flex items-center justify-between py-3 gap-4" key={f.id}>
                  <div className="min-w-0 flex-1">
                    <a
                      className="text-sm font-medium text-eagle-blue hover:text-eagle-blue/80 hover:underline font-body truncate block min-w-0"
                      href={`/api/admin/reimbursements/file?key=${encodeURIComponent(f.r2_key)}`}
                      rel="noopener noreferrer"
                      target="_blank"
                      title="Open in browser"
                    >
                      {f.original_filename}
                    </a>
                    <p className="text-xs text-gray-500 font-body">
                      {f.content_type} &middot; {formatFileSize(f.file_size)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {!f.original_filename.toLowerCase().endsWith('-converted.pdf') && (
                      <button
                        className="text-sm text-creek-green hover:text-creek-green/80 font-medium font-body disabled:opacity-50 whitespace-nowrap"
                        disabled={attachmentBusy || removingLineId !== null}
                        onClick={() => handleConvertAttachment(f.id, f.original_filename)}
                        type="button"
                      >
                        {convertingAttachmentId === f.id ? 'Converting…' : 'Convert to AI PDF'}
                      </button>
                    )}
                    <a
                      className="text-sm text-eagle-blue hover:text-eagle-blue/80 font-medium font-body transition-colors whitespace-nowrap"
                      href={`/api/admin/reimbursements/file?key=${encodeURIComponent(f.r2_key)}&download=1`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Download
                    </a>
                    <button
                      className="text-sm text-red-600 hover:text-red-700 font-medium font-body disabled:opacity-50 whitespace-nowrap"
                      disabled={attachmentBusy || removingLineId !== null}
                      onClick={() => handleRemoveAttachment(f.id, f.original_filename)}
                      type="button"
                    >
                      {removingAttachmentId === f.id ? 'Removing…' : 'Remove'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Upload receipt */}
          <div className="border-t border-gray-100 pt-4">
            <p className="block text-sm font-medium text-charcoal font-body mb-2">Add Receipt</p>
            <p className="text-xs text-gray-500 font-body mb-3">
              Upload an image or PDF — it will be processed with AI and added to this submission.
            </p>
            <label
              className={`inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-charcoal shadow-sm hover:border-eagle-blue hover:text-eagle-blue transition-colors font-body cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 4v16m8-8H4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
              {uploading ? 'Processing...' : 'Choose file'}
              <input
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="sr-only"
                disabled={uploading}
                onChange={handleFileUpload}
                type="file"
              />
            </label>
            {uploadFeedback && (
              <div
                className={`mt-3 text-sm font-body px-3 py-2 rounded-lg ${
                  uploadFeedback.type === 'success'
                    ? 'bg-creek-green/10 text-creek-green'
                    : 'bg-red-50 text-red-700'
                }`}
                role="alert"
              >
                {uploadFeedback.message}
              </div>
            )}
          </div>
        </div>

        {/* Delete Section */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
          <h2 className="text-lg font-heading font-semibold text-red-700 mb-2">Danger Zone</h2>
          <p className="text-sm text-gray-600 font-body mb-4">
            Permanently delete this submission and all associated data. This action cannot be
            undone.
          </p>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors font-body disabled:opacity-50"
            disabled={deleting}
            onClick={handleDelete}
            type="button"
          >
            {deleting ? 'Deleting...' : 'Delete Submission'}
          </button>
        </div>
      </main>
    </div>
  );
}
