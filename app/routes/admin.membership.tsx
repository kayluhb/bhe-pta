import {useState} from 'react';
import {useLoaderData} from 'react-router';
import {requireAdmin, type SessionPayload} from '~/lib/admin/auth';
import {getCloudflare} from '~/lib/cloudflare-context';
import {mergeParentMeta} from '~/lib/meta';
import type {Route} from './+types/admin.membership';

export function meta({matches}: Route.MetaArgs) {
  return mergeParentMeta(matches, [{title: 'Membership import | Admin'}]);
}

interface SchoolYearOption {
  id: string;
  is_default: number;
  label: string;
}

export async function loader({request, context}: Route.LoaderArgs) {
  const env = getCloudflare(context).env;
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;
  const user: SessionPayload = auth;

  const db = env.REIMBURSEMENT_DB;
  const schoolYears = await db
    .prepare(
      'SELECT id, label, is_default FROM school_years ORDER BY sort_order DESC, starts_on DESC',
    )
    .all<SchoolYearOption>();

  return {schoolYears: schoolYears.results, user};
}

const HEADER_ALREADY_TRACKED = 'X-Already-Tracked-Count';
const HEADER_NEW_COUNT = 'X-New-Count';
const HEADER_SKIPPED_BLANK_EMAIL = 'X-Skipped-Blank-Email-Count';
const HEADER_SKIPPED_CHILD_DETAILS = 'X-Skipped-Child-Details';
const HEADER_SKIPPED_CHILD_LINES = 'X-Skipped-Child-Lines';
const HEADER_SKIPPED_DUPLICATE = 'X-Skipped-Duplicate-Count';

function getHeaderNumber(headers: Headers, name: string): number {
  return Number(headers.get(name) ?? 0);
}

interface ImportSummary {
  alreadyTracked: number;
  newCount: number;
  skippedBlankEmails: number;
  skippedChildDetails: {familyName: string; line: string}[];
  skippedChildLines: number;
  skippedDuplicates: number;
}

export default function AdminMembership() {
  const {schoolYears, user} = useLoaderData<typeof loader>();
  const defaultYear = schoolYears.find((year) => year.is_default) ?? schoolYears[0];

  const [schoolYearId, setSchoolYearId] = useState(defaultYear?.id ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const handleSubmit = async () => {
    if (!file || !schoolYearId) {
      setError('Choose a school year and a file.');
      return;
    }
    setBusy(true);
    setError(null);
    setSummary(null);
    try {
      const body = new FormData();
      body.append('schoolYearId', schoolYearId);
      body.append('file', file);
      const res = await fetch('/api/admin/membership/import', {body, method: 'POST'});
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {error?: string};
        throw new Error(data.error || 'Import failed');
      }
      if (!res.headers.has(HEADER_NEW_COUNT)) {
        throw new Error('Session expired or unexpected response — please reload and log in again.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `pta-import-${schoolYearId}.csv`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      setSummary({
        alreadyTracked: getHeaderNumber(res.headers, HEADER_ALREADY_TRACKED),
        newCount: getHeaderNumber(res.headers, HEADER_NEW_COUNT),
        skippedBlankEmails: getHeaderNumber(res.headers, HEADER_SKIPPED_BLANK_EMAIL),
        skippedChildDetails: JSON.parse(
          decodeURIComponent(res.headers.get(HEADER_SKIPPED_CHILD_DETAILS) ?? '[]'),
        ) as {familyName: string; line: string}[],
        skippedChildLines: getHeaderNumber(res.headers, HEADER_SKIPPED_CHILD_LINES),
        skippedDuplicates: getHeaderNumber(res.headers, HEADER_SKIPPED_DUPLICATE),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-white">
      <header className="bg-gradient-to-r from-eagle-blue to-night-blue shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl md:text-2xl font-heading font-bold text-white">
            Membership import
          </h1>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <a
              className="text-sm font-body text-white/90 hover:text-white underline underline-offset-2 transition-colors"
              href="/admin/reimbursements"
            >
              Reimbursements
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

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <p className="text-sm text-gray-600 font-body max-w-2xl">
          Upload the Cheddar Up membership-form export. New members (not already exported this
          school year) come back as a Texas PTA import CSV, ready for MyPTEZ.
        </p>

        {error && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 font-body"
            role="alert"
          >
            {error}
          </div>
        )}

        {summary && (
          <div
            className="rounded-lg border border-creek-green/30 bg-creek-green/10 px-4 py-3 text-sm text-charcoal font-body"
            role="status"
          >
            {summary.newCount} new member{summary.newCount === 1 ? '' : 's'} exported.{' '}
            {summary.alreadyTracked} already tracked this year.
            {summary.skippedChildLines > 0 &&
              ` ${summary.skippedChildLines} child line(s) skipped (not a name).`}
            {summary.skippedDuplicates > 0 &&
              ` ${summary.skippedDuplicates} duplicate email(s) skipped within this upload.`}
            {summary.skippedBlankEmails > 0 &&
              ` ${summary.skippedBlankEmails} row(s) skipped for having no email address.`}
            {summary.skippedChildLines > 0 && summary.skippedChildDetails.length > 0 && (
              <ul className="mt-2 list-disc pl-5">
                {summary.skippedChildDetails.map(({familyName, line}) => (
                  <li key={`${familyName}-${line}`}>
                    {familyName}: "{line}"
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4 text-sm font-body">
          <div>
            <label className="block font-medium text-charcoal mb-1" htmlFor="school-year">
              School year
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue"
              id="school-year"
              onChange={(event) => setSchoolYearId(event.target.value)}
              value={schoolYearId}
            >
              {schoolYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.label}
                  {year.is_default ? ' (default)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium text-charcoal mb-1" htmlFor="export-file">
              Cheddar Up export (.csv)
            </label>
            <input
              accept=".csv,text/csv"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-charcoal shadow-sm"
              id="export-file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              type="file"
            />
          </div>
          <button
            className="inline-flex items-center rounded-lg bg-eagle-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-eagle-blue/90 disabled:opacity-50 font-body"
            disabled={busy}
            onClick={handleSubmit}
            type="button"
          >
            {busy ? 'Generating…' : 'Generate import CSV'}
          </button>
        </section>
      </main>
    </div>
  );
}
