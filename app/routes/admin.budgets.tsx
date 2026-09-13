import {useEffect, useState} from 'react';
import {useLoaderData, useRevalidator} from 'react-router';
import {requireAdmin, type SessionPayload} from '~/lib/admin/auth';
import type {BudgetMonthRow} from '~/lib/budget/ids';
import {formatCentsAsMoney} from '~/lib/budget/money';
import {getCloudflare} from '~/lib/cloudflare-context';
import {mergeParentMeta} from '~/lib/meta';
import type {Route} from './+types/admin.budgets';

export function meta({matches}: Route.MetaArgs) {
  return mergeParentMeta(matches, [{title: 'Budgets | Admin'}]);
}

export async function loader({request, context}: Route.LoaderArgs) {
  const env = getCloudflare(context).env;
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;
  const user: SessionPayload = auth;

  const rows = await env.REIMBURSEMENT_DB.prepare(
    'SELECT * FROM budget_months ORDER BY id DESC',
  ).all<BudgetMonthRow>();

  return {months: rows.results ?? [], user};
}

export default function AdminBudgets() {
  const {months, user} = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [seedId, setSeedId] = useState('');
  const [seedLabel, setSeedLabel] = useState('');
  const [seedAsOf, setSeedAsOf] = useState('');
  const [seedBalance, setSeedBalance] = useState('');
  const [seedFile, setSeedFile] = useState<File | null>(null);
  const [seeding, setSeeding] = useState(false);

  const [genId, setGenId] = useState('');
  const [genLabel, setGenLabel] = useState('');
  const [genTemplate, setGenTemplate] = useState(months[0]?.id ?? '');
  const [genAsOf, setGenAsOf] = useState('');
  const [genBalance, setGenBalance] = useState('');
  const [genFile, setGenFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!genTemplate && months[0]?.id) {
      setGenTemplate(months[0].id);
    }
  }, [genTemplate, months]);

  const handleSeed = async () => {
    setSeeding(true);
    setError(null);
    setMessage(null);
    try {
      if (!seedFile) {
        setError('Choose a budget CSV to seed');
        return;
      }
      const existing = months.find((m) => m.id === seedId.trim());
      if (
        existing &&
        !window.confirm(
          `Overwrite existing ${existing.label} (${existing.id})? This replaces the stored CSV.`,
        )
      ) {
        return;
      }
      const body = new FormData();
      body.set('file', seedFile);
      body.set('id', seedId.trim());
      body.set('label', seedLabel.trim());
      body.set('as_of_date', seedAsOf.trim());
      if (seedBalance.trim()) body.set('bank_balance', seedBalance.trim());

      const res = await fetch('/api/admin/budgets/seed', {body, method: 'POST'});
      const data = (await res.json()) as {error?: string; overwritten?: boolean};
      if (!res.ok) {
        setError(data.error || 'Seed failed');
        return;
      }
      setMessage(data.overwritten ? 'Seeded month overwritten.' : 'Budget month seeded.');
      setSeedFile(null);
      revalidator.revalidate();
    } catch {
      setError('Network error while seeding');
    } finally {
      setSeeding(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setMessage(null);
    try {
      if (!genFile) {
        setError('Choose a P&L CSV to generate from');
        return;
      }
      if (!genTemplate) {
        setError('Select a template month (seed one first if the list is empty)');
        return;
      }
      const existing = months.find((m) => m.id === genId.trim());
      if (
        existing &&
        !window.confirm(
          `Overwrite existing ${existing.label} (${existing.id})? This replaces the stored budget and P&L.`,
        )
      ) {
        return;
      }
      const body = new FormData();
      body.set('file', genFile);
      body.set('id', genId.trim());
      body.set('label', genLabel.trim());
      body.set('template_month_id', genTemplate);
      body.set('as_of_date', genAsOf.trim());
      body.set('bank_balance', genBalance.trim());

      const res = await fetch('/api/admin/budgets/generate', {body, method: 'POST'});
      const data = (await res.json()) as {
        error?: string;
        overwritten?: boolean;
        unmatchedBudgetLines?: string[];
      };
      if (!res.ok) {
        setError(data.error || 'Generate failed');
        return;
      }
      const unmatched =
        data.unmatchedBudgetLines && data.unmatchedBudgetLines.length > 0
          ? ` Unmatched mapped lines: ${data.unmatchedBudgetLines.join(', ')}.`
          : '';
      setMessage(`${data.overwritten ? 'Month overwritten.' : 'Month created.'}${unmatched}`);
      setGenFile(null);
      revalidator.revalidate();
    } catch {
      setError('Network error while generating');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-white">
      <header className="bg-gradient-to-r from-eagle-blue to-night-blue shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl md:text-2xl font-heading font-bold text-white">Budgets</h1>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <a
              className="text-sm font-body text-white/90 hover:text-white underline underline-offset-2 transition-colors"
              href="/admin/reimbursements"
            >
              Reimbursements
            </a>
            <a
              className="text-sm font-body text-white/90 hover:text-white underline underline-offset-2 transition-colors"
              href="/admin/membership"
            >
              Membership
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

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <p className="text-sm text-gray-600 font-body max-w-2xl">
          Upload a QuickBooks Profit and Loss Detail CSV to build a month’s budget from a prior
          stored month. Seed the first month by uploading an existing budget CSV. Public{' '}
          <a className="text-eagle-blue underline underline-offset-2" href="/budget">
            /budget
          </a>{' '}
          still redirects to the Google Sheet.
        </p>

        {error && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 font-body"
            role="alert"
          >
            {error}
          </div>
        )}
        {message && (
          <div
            className="rounded-lg border border-creek-green/30 bg-creek-green/10 px-4 py-3 text-sm text-charcoal font-body"
            role="status"
          >
            {message}
          </div>
        )}

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-heading font-semibold text-charcoal mb-4">
            Generate from P&L
          </h2>
          {months.length === 0 ? (
            <p className="text-sm text-gray-600 font-body mb-4">
              Seed a template month below before generating.
            </p>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-body">
            <div>
              <label className="block font-medium text-charcoal mb-1" htmlFor="gen-id">
                Target month id <span className="text-gray-500 font-normal">(YYYY-MM)</span>
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue font-mono text-xs"
                id="gen-id"
                onChange={(e) => setGenId(e.target.value)}
                placeholder="2026-09"
                type="text"
                value={genId}
              />
            </div>
            <div>
              <label className="block font-medium text-charcoal mb-1" htmlFor="gen-label">
                Label <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue"
                id="gen-label"
                onChange={(e) => setGenLabel(e.target.value)}
                placeholder="September 2026"
                type="text"
                value={genLabel}
              />
            </div>
            <div>
              <label className="block font-medium text-charcoal mb-1" htmlFor="gen-template">
                Template month
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue"
                disabled={months.length === 0}
                id="gen-template"
                onChange={(e) => setGenTemplate(e.target.value)}
                value={genTemplate}
              >
                {months.length === 0 ? (
                  <option value="">No months yet</option>
                ) : (
                  months.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label} ({m.id})
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block font-medium text-charcoal mb-1" htmlFor="gen-asof">
                As-of date
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue"
                id="gen-asof"
                onChange={(e) => setGenAsOf(e.target.value)}
                type="date"
                value={genAsOf}
              />
            </div>
            <div>
              <label className="block font-medium text-charcoal mb-1" htmlFor="gen-balance">
                Current bank balance
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue"
                id="gen-balance"
                onChange={(e) => setGenBalance(e.target.value)}
                placeholder="137289.55"
                type="text"
                value={genBalance}
              />
            </div>
            <div>
              <label className="block font-medium text-charcoal mb-1" htmlFor="gen-file">
                P&L Detail CSV
              </label>
              <input
                accept=".csv,text/csv"
                className="w-full text-sm text-charcoal file:mr-3 file:rounded-lg file:border-0 file:bg-eagle-blue file:px-3 file:py-2 file:text-white"
                id="gen-file"
                onChange={(e) => setGenFile(e.target.files?.[0] ?? null)}
                type="file"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              className="rounded-lg bg-eagle-blue px-4 py-2 text-sm font-medium text-white hover:bg-night-blue disabled:opacity-50 transition-colors"
              disabled={generating || months.length === 0}
              onClick={() => void handleGenerate()}
              type="button"
            >
              {generating ? 'Generating…' : 'Generate budget'}
            </button>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-heading font-semibold text-charcoal mb-4">
            Seed template month
          </h2>
          <p className="text-sm text-gray-600 font-body mb-4">
            Upload an existing budget CSV (e.g. August 2026.csv) so later months have a template.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-body">
            <div>
              <label className="block font-medium text-charcoal mb-1" htmlFor="seed-id">
                Month id <span className="text-gray-500 font-normal">(YYYY-MM)</span>
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue font-mono text-xs"
                id="seed-id"
                onChange={(e) => setSeedId(e.target.value)}
                placeholder="2026-08"
                type="text"
                value={seedId}
              />
            </div>
            <div>
              <label className="block font-medium text-charcoal mb-1" htmlFor="seed-label">
                Label <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue"
                id="seed-label"
                onChange={(e) => setSeedLabel(e.target.value)}
                placeholder="August 2026"
                type="text"
                value={seedLabel}
              />
            </div>
            <div>
              <label className="block font-medium text-charcoal mb-1" htmlFor="seed-asof">
                As-of date
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue"
                id="seed-asof"
                onChange={(e) => setSeedAsOf(e.target.value)}
                type="date"
                value={seedAsOf}
              />
            </div>
            <div>
              <label className="block font-medium text-charcoal mb-1" htmlFor="seed-balance">
                Bank balance{' '}
                <span className="text-gray-500 font-normal">(optional if in CSV header)</span>
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue"
                id="seed-balance"
                onChange={(e) => setSeedBalance(e.target.value)}
                placeholder="137289.55"
                type="text"
                value={seedBalance}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-medium text-charcoal mb-1" htmlFor="seed-file">
                Budget CSV
              </label>
              <input
                accept=".csv,text/csv"
                className="w-full text-sm text-charcoal file:mr-3 file:rounded-lg file:border-0 file:bg-eagle-blue file:px-3 file:py-2 file:text-white"
                id="seed-file"
                onChange={(e) => setSeedFile(e.target.files?.[0] ?? null)}
                type="file"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              className="rounded-lg border border-eagle-blue px-4 py-2 text-sm font-medium text-eagle-blue hover:bg-eagle-blue/5 disabled:opacity-50 transition-colors"
              disabled={seeding}
              onClick={() => void handleSeed()}
              type="button"
            >
              {seeding ? 'Seeding…' : 'Seed month'}
            </button>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-heading font-semibold text-charcoal">Stored months</h2>
          </div>
          {months.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-500 font-body">
              No budget months stored yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm font-body">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Month</th>
                    <th className="px-4 py-3 font-medium">As of</th>
                    <th className="px-4 py-3 font-medium">Balance</th>
                    <th className="px-4 py-3 font-medium">Template</th>
                    <th className="px-4 py-3 font-medium">Files</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {months.map((m) => (
                    <tr key={m.id}>
                      <td className="px-4 py-3 text-charcoal">
                        <div className="font-medium">{m.label}</div>
                        <div className="text-xs text-gray-500 font-mono">{m.id}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{m.as_of_date}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatCentsAsMoney(m.bank_balance_cents)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-mono text-xs">
                        {m.template_month_id ?? '—'}
                      </td>
                      <td className="px-4 py-3 space-x-3">
                        <a
                          className="text-eagle-blue underline underline-offset-2"
                          href={`/api/admin/budgets/${encodeURIComponent(m.id)}/file?kind=budget`}
                        >
                          Budget
                        </a>
                        {m.pl_r2_key ? (
                          <a
                            className="text-eagle-blue underline underline-offset-2"
                            href={`/api/admin/budgets/${encodeURIComponent(m.id)}/file?kind=pl`}
                          >
                            P&L
                          </a>
                        ) : (
                          <span className="text-gray-400">No P&L</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
