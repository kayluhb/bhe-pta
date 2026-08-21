import {useState} from 'react';
import {useLoaderData, useNavigate} from 'react-router';
import {SearchableBudgetAccountSelect} from '~/components/reimbursement/SearchableBudgetAccountSelect';
import {requireAdmin, type SessionPayload} from '~/lib/admin/auth';
import {blurNumberInputOnWheel} from '~/lib/blur-number-input-on-wheel';
import {getCloudflare} from '~/lib/cloudflare-context';
import {mergeParentMeta} from '~/lib/meta';
import {randomUUID} from '~/lib/random-uuid';
import {BUDGET_ACCOUNTS, MAX_RECEIPT_LINES} from '~/lib/reimbursement/validation';
import type {Route} from './+types/admin.reimbursement-paper';

type AmountRow = {id: string; value: string};

function newAmountRow(): AmountRow {
  return {id: randomUUID(), value: ''};
}

export function meta({matches}: Route.MetaArgs) {
  return mergeParentMeta(matches, [{title: 'Add paper reimbursement | Admin'}]);
}

export async function loader({request, context}: Route.LoaderArgs) {
  const auth = await requireAdmin(request, getCloudflare(context).env);
  if (auth instanceof Response) return auth;
  const user: SessionPayload = auth;
  return {user};
}

export default function AdminReimbursementPaper() {
  const {user} = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [amountRows, setAmountRows] = useState<AmountRow[]>(() => [newAmountRow()]);
  const [budget, setBudget] = useState<string>(BUDGET_ACCOUNTS[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [payableTo, setPayableTo] = useState('');

  const addRow = () => {
    setAmountRows((rows) => (rows.length >= MAX_RECEIPT_LINES ? rows : [...rows, newAmountRow()]));
  };

  const removeRow = (id: string) => {
    setAmountRows((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.id !== id)));
  };

  const setRowAmount = (id: string, value: string) => {
    setAmountRows((rows) => rows.map((r) => (r.id === id ? {...r, value} : r)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const lines = amountRows
      .map((row) => {
        const t = row.value.trim();
        if (!t) return null;
        const n = Number(t);
        return Number.isFinite(n) && n > 0 ? {amount: n} : null;
      })
      .filter((x): x is {amount: number} => x !== null);

    if (!budget.trim()) {
      setError('Choose a budget account.');
      return;
    }
    if (lines.length === 0) {
      setError('Enter at least one positive amount.');
      return;
    }

    setPending(true);
    try {
      const res = await fetch('/api/admin/reimbursements/paper', {
        body: JSON.stringify({
          lines,
          payableTo: payableTo.trim(),
          primaryBudgetAccount: budget,
        }),
        headers: {'Content-Type': 'application/json'},
        method: 'POST',
      });
      const data = (await res.json()) as {error?: string; submissionId?: string};
      if (!res.ok) {
        setError(data.error || 'Could not save.');
        return;
      }
      if (data.submissionId) {
        navigate(`/admin/reimbursements/${data.submissionId}`);
      }
    } catch {
      setError('Network error.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-white">
      <header className="bg-linear-to-r from-eagle-blue to-night-blue shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg md:text-xl font-heading font-bold text-white">
            Paper reimbursement
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <a
              className="text-white/90 hover:text-white underline underline-offset-2"
              href="/admin/reimbursements"
            >
              All reimbursements
            </a>
            <span className="text-white/80 hidden sm:inline">{user.name}</span>
            <a className="text-white/70 hover:text-white underline" href="/api/auth/logout">
              Logout
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8 font-body">
        <p className="text-sm text-charcoal/80 mb-6">
          Adds a pending submission to the same list as online requests. No receipt files — only
          payable name, budget account, and amounts (one row per expense line).
        </p>

        <form
          className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1" htmlFor="payableTo">
              Payable to
            </label>
            <input
              autoComplete="name"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-charcoal"
              id="payableTo"
              name="payableTo"
              onChange={(ev) => setPayableTo(ev.target.value)}
              required
              type="text"
              value={payableTo}
            />
          </div>

          <SearchableBudgetAccountSelect
            label="Budget account"
            onChange={setBudget}
            required
            value={budget}
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-charcoal">Amounts (USD)</span>
              <button
                className="text-sm text-eagle-blue hover:underline disabled:opacity-50"
                disabled={amountRows.length >= MAX_RECEIPT_LINES}
                onClick={addRow}
                type="button"
              >
                Add line
              </button>
            </div>
            <ul className="space-y-2">
              {amountRows.map((row) => (
                <li className="flex gap-2 items-center" key={row.id}>
                  <input
                    aria-label={`Amount line ${amountRows.findIndex((r) => r.id === row.id) + 1}`}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-charcoal"
                    inputMode="decimal"
                    min="0"
                    onChange={(ev) => setRowAmount(row.id, ev.target.value)}
                    onWheel={blurNumberInputOnWheel}
                    placeholder="0.00"
                    step="any"
                    type="number"
                    value={row.value}
                  />
                  {amountRows.length > 1 ? (
                    <button
                      className="shrink-0 text-sm text-gray-600 hover:text-red-600"
                      onClick={() => removeRow(row.id)}
                      type="button"
                    >
                      Remove
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              className="rounded-md bg-eagle-blue px-4 py-2 text-sm font-medium text-white hover:bg-night-blue disabled:opacity-60"
              disabled={pending}
              type="submit"
            >
              {pending ? 'Saving…' : 'Save'}
            </button>
            <a
              className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm text-charcoal hover:bg-gray-50"
              href="/admin/reimbursements"
            >
              Cancel
            </a>
          </div>
        </form>
      </main>
    </div>
  );
}
