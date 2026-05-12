import {useState} from 'react';
import {useLoaderData, useRevalidator} from 'react-router';
import {requireAdmin, type SessionPayload} from '~/lib/admin/auth';
import {mergeParentMeta} from '~/lib/meta';
import {assertValidSchoolYearId, slugSchoolYearIdFromLabel} from '~/lib/reimbursement/school-years';
import type {Route} from './+types/admin.school-years';

export function meta({matches}: Route.MetaArgs) {
  return mergeParentMeta(matches, [{title: 'School years | Admin'}]);
}

interface SchoolYearRow {
  created_at: string;
  ends_on: string;
  id: string;
  is_default: number;
  label: string;
  sort_order: number;
  starts_on: string;
  submission_count: number;
  updated_at: string;
}

export async function loader({request, context}: Route.LoaderArgs) {
  const auth = await requireAdmin(request, context.cloudflare.env);
  if (auth instanceof Response) return auth;
  const user: SessionPayload = auth;

  const db = context.cloudflare.env.REIMBURSEMENT_DB;
  const rows = await db
    .prepare(
      `SELECT y.*,
         (SELECT COUNT(*) FROM submissions s WHERE s.school_year_id = y.id) AS submission_count
       FROM school_years y
       ORDER BY y.sort_order DESC, y.starts_on DESC`,
    )
    .all<SchoolYearRow>();

  return {schoolYears: rows.results, user};
}

export default function AdminSchoolYears() {
  const {schoolYears, user} = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [createId, setCreateId] = useState('');
  const [createLabel, setCreateLabel] = useState('');
  const [createStarts, setCreateStarts] = useState('');
  const [createEnds, setCreateEnds] = useState('');
  const [createSort, setCreateSort] = useState('');
  const [createDefault, setCreateDefault] = useState(false);
  const [creating, setCreating] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editStarts, setEditStarts] = useState('');
  const [editEnds, setEditEnds] = useState('');
  const [editSort, setEditSort] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const startEdit = (row: SchoolYearRow) => {
    setEditId(row.id);
    setEditLabel(row.label);
    setEditStarts(row.starts_on);
    setEditEnds(row.ends_on);
    setEditSort(String(row.sort_order));
    setError(null);
  };

  const cancelEdit = () => {
    setEditId(null);
    setError(null);
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    const idRaw = createId.trim() || slugSchoolYearIdFromLabel(createLabel);
    const idErr = assertValidSchoolYearId(idRaw);
    if (idErr) {
      setError(idErr);
      setCreating(false);
      return;
    }
    const sortNum =
      createSort.trim() === '' ? undefined : Math.trunc(Number.parseInt(createSort, 10));
    if (createSort.trim() !== '' && !Number.isFinite(sortNum)) {
      setError('Sort order must be a whole number.');
      setCreating(false);
      return;
    }
    try {
      const res = await fetch('/api/admin/school-years', {
        body: JSON.stringify({
          ends_on: createEnds,
          id: createId.trim() || undefined,
          is_default: createDefault,
          label: createLabel,
          sort_order: sortNum,
          starts_on: createStarts,
        }),
        headers: {'Content-Type': 'application/json'},
        method: 'POST',
      });
      const data = (await res.json().catch(() => ({}))) as {error?: string};
      if (!res.ok) {
        throw new Error(data.error || 'Create failed');
      }
      setCreateId('');
      setCreateLabel('');
      setCreateStarts('');
      setCreateEnds('');
      setCreateSort('');
      setCreateDefault(false);
      revalidator.revalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    setSavingEdit(true);
    setError(null);
    const sortNum = editSort.trim() === '' ? undefined : Math.trunc(Number.parseInt(editSort, 10));
    if (editSort.trim() !== '' && !Number.isFinite(sortNum)) {
      setError('Sort order must be a whole number.');
      setSavingEdit(false);
      return;
    }
    try {
      const res = await fetch(`/api/admin/school-years/${encodeURIComponent(editId)}`, {
        body: JSON.stringify({
          ends_on: editEnds,
          label: editLabel,
          sort_order: sortNum,
          starts_on: editStarts,
        }),
        headers: {'Content-Type': 'application/json'},
        method: 'PATCH',
      });
      const data = (await res.json().catch(() => ({}))) as {error?: string};
      if (!res.ok) {
        throw new Error(data.error || 'Save failed');
      }
      setEditId(null);
      revalidator.revalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleMakeDefault = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/school-years/${encodeURIComponent(id)}`, {
        body: JSON.stringify({is_default: true}),
        headers: {'Content-Type': 'application/json'},
        method: 'PATCH',
      });
      const data = (await res.json().catch(() => ({}))) as {error?: string};
      if (!res.ok) {
        throw new Error(data.error || 'Update failed');
      }
      revalidator.revalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Delete school year “${id}”? This cannot be undone.`)) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/school-years/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = (await res.json().catch(() => ({}))) as {error?: string};
      if (!res.ok) {
        throw new Error(data.error || 'Delete failed');
      }
      if (editId === id) setEditId(null);
      revalidator.revalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-warm-white">
      <header className="bg-gradient-to-r from-eagle-blue to-night-blue shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl md:text-2xl font-heading font-bold text-white">School years</h1>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <a
              className="text-sm font-body text-white/90 hover:text-white underline underline-offset-2 transition-colors"
              href="/admin/reimbursements"
            >
              Reimbursements
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
          New reimbursement submissions are assigned to the year marked <strong>Default</strong>.
          Existing submissions keep their year unless you change them on the submission detail page.
        </p>

        {error && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 font-body"
            role="alert"
          >
            {error}
          </div>
        )}

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-heading font-semibold text-charcoal mb-4">Add school year</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-body">
            <div className="sm:col-span-2">
              <label className="block font-medium text-charcoal mb-1" htmlFor="create-label">
                Label <span className="text-gray-500 font-normal">(e.g. 2026-27)</span>
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue"
                id="create-label"
                onChange={(e) => setCreateLabel(e.target.value)}
                type="text"
                value={createLabel}
              />
            </div>
            <div>
              <label className="block font-medium text-charcoal mb-1" htmlFor="create-id">
                Id{' '}
                <span className="text-gray-500 font-normal">(optional; defaults from label)</span>
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue font-mono text-xs"
                id="create-id"
                onChange={(e) => setCreateId(e.target.value)}
                placeholder="2026-27"
                type="text"
                value={createId}
              />
            </div>
            <div>
              <label className="block font-medium text-charcoal mb-1" htmlFor="create-sort">
                Sort order <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue"
                id="create-sort"
                inputMode="numeric"
                onChange={(e) => setCreateSort(e.target.value)}
                type="text"
                value={createSort}
              />
            </div>
            <div>
              <label className="block font-medium text-charcoal mb-1" htmlFor="create-starts">
                Starts on
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue"
                id="create-starts"
                onChange={(e) => setCreateStarts(e.target.value)}
                type="date"
                value={createStarts}
              />
            </div>
            <div>
              <label className="block font-medium text-charcoal mb-1" htmlFor="create-ends">
                Ends on
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue"
                id="create-ends"
                onChange={(e) => setCreateEnds(e.target.value)}
                type="date"
                value={createEnds}
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                checked={createDefault}
                className="h-4 w-4 rounded border-gray-300 text-eagle-blue focus:ring-eagle-blue"
                id="create-default"
                onChange={(e) => setCreateDefault(e.target.checked)}
                type="checkbox"
              />
              <label className="text-charcoal" htmlFor="create-default">
                Set as default for new submissions
              </label>
            </div>
            <div className="sm:col-span-2">
              <button
                className="inline-flex items-center rounded-lg bg-eagle-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-eagle-blue/90 disabled:opacity-50 font-body"
                disabled={creating}
                onClick={handleCreate}
                type="button"
              >
                {creating ? 'Creating…' : 'Create school year'}
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <h2 className="sr-only">School years list</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-body">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Label
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Id
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                    Range
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Default
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">
                    Subs
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schoolYears.map((row) => (
                  <tr className="hover:bg-gray-50/50" key={row.id}>
                    {editId === row.id ? (
                      <>
                        <td className="px-4 py-3 align-top" colSpan={4}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label
                                className="block text-xs font-medium text-gray-600 mb-1"
                                htmlFor={`edit-label-${row.id}`}
                              >
                                Label
                              </label>
                              <input
                                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                                id={`edit-label-${row.id}`}
                                onChange={(e) => setEditLabel(e.target.value)}
                                type="text"
                                value={editLabel}
                              />
                            </div>
                            <div>
                              <label
                                className="block text-xs font-medium text-gray-600 mb-1"
                                htmlFor={`edit-sort-${row.id}`}
                              >
                                Sort order
                              </label>
                              <input
                                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                                id={`edit-sort-${row.id}`}
                                onChange={(e) => setEditSort(e.target.value)}
                                type="text"
                                value={editSort}
                              />
                            </div>
                            <div>
                              <label
                                className="block text-xs font-medium text-gray-600 mb-1"
                                htmlFor={`edit-starts-${row.id}`}
                              >
                                Starts on
                              </label>
                              <input
                                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                                id={`edit-starts-${row.id}`}
                                onChange={(e) => setEditStarts(e.target.value)}
                                type="date"
                                value={editStarts}
                              />
                            </div>
                            <div>
                              <label
                                className="block text-xs font-medium text-gray-600 mb-1"
                                htmlFor={`edit-ends-${row.id}`}
                              >
                                Ends on
                              </label>
                              <input
                                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                                id={`edit-ends-${row.id}`}
                                onChange={(e) => setEditEnds(e.target.value)}
                                type="date"
                                value={editEnds}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-right tabular-nums text-gray-600">
                          {row.submission_count}
                        </td>
                        <td className="px-4 py-3 align-top text-right space-y-1">
                          <button
                            className="block w-full sm:w-auto sm:inline rounded-md bg-eagle-blue px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                            disabled={savingEdit}
                            onClick={handleSaveEdit}
                            type="button"
                          >
                            Save
                          </button>
                          <button
                            className="block w-full sm:w-auto sm:inline sm:ml-2 rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-charcoal"
                            onClick={cancelEdit}
                            type="button"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-medium text-charcoal">{row.label}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{row.id}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {row.starts_on} → {row.ends_on}
                        </td>
                        <td className="px-4 py-3">
                          {row.is_default ? (
                            <span className="inline-flex rounded-full bg-creek-green/15 px-2 py-0.5 text-xs font-medium text-creek-green border border-creek-green/30">
                              Default
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                          {row.submission_count}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                          {!row.is_default && (
                            <button
                              className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-charcoal hover:bg-gray-50 disabled:opacity-50"
                              disabled={busyId !== null}
                              onClick={() => handleMakeDefault(row.id)}
                              type="button"
                            >
                              {busyId === row.id ? '…' : 'Make default'}
                            </button>
                          )}
                          <button
                            className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-charcoal hover:bg-gray-50"
                            disabled={busyId !== null}
                            onClick={() => startEdit(row)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                            disabled={busyId !== null}
                            onClick={() => handleDelete(row.id)}
                            type="button"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
