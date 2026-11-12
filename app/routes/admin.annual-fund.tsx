import {useState} from 'react';
import {useLoaderData} from 'react-router';

import {FundraisingProgress} from '~/components/fundraising/FundraisingProgress';
import type {FundraisingMilestone} from '~/data/annual-fund-campaign';
import {requireAdmin, type SessionPayload} from '~/lib/admin/auth';
import {getCloudflare} from '~/lib/cloudflare-context';
import {campaignFromDraft, parseAnnualFundSubmission, parseMoney} from '~/lib/fundraising/campaign';
import {loadAnnualFundDraft} from '~/lib/fundraising/campaign-store';
import {formatCurrency} from '~/lib/fundraising/progress';
import {mergeParentMeta} from '~/lib/meta';
import type {Route} from './+types/admin.annual-fund';

export function meta({matches}: Route.MetaArgs) {
  return mergeParentMeta(matches, [{title: 'Annual Fund | Admin'}]);
}

const fieldClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-charcoal shadow-sm focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue';

interface MilestoneForm {
  amount: string;
  description: string;
  id: string;
  label: string;
  targetDate: string;
}

function moneyInput(amount: number): string {
  return String(amount);
}

function milestonesToForm(milestones: FundraisingMilestone[]): MilestoneForm[] {
  return milestones.map((milestone) => ({
    amount: moneyInput(milestone.amount),
    description: milestone.description,
    id: milestone.id,
    label: milestone.label,
    targetDate: milestone.targetDate,
  }));
}

function formSnapshot(fields: {
  ask: string;
  goal: string;
  milestones: MilestoneForm[];
  offline: string;
  online: string;
  schoolYear: string;
  thermometerVisible: boolean;
  title: string;
}): string {
  return JSON.stringify(fields);
}

function nextMilestoneId(existing: MilestoneForm[]): string {
  let n = existing.length + 1;
  const ids = new Set(existing.map((milestone) => milestone.id));
  let id = `milestone-${n}`;
  while (ids.has(id)) {
    n += 1;
    id = `milestone-${n}`;
  }
  return id;
}

export async function loader({request, context}: Route.LoaderArgs) {
  const env = getCloudflare(context).env;
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;
  const user: SessionPayload = auth;
  const loaded = await loadAnnualFundDraft(env.REIMBURSEMENT_DB);
  return {draft: loaded.draft, source: loaded.source, user};
}

export default function AdminAnnualFund() {
  const {draft, source, user} = useLoaderData<typeof loader>();
  const [title, setTitle] = useState(draft.title);
  const [schoolYear, setSchoolYear] = useState(draft.schoolYear);
  const [online, setOnline] = useState(moneyInput(draft.onlineRaisedAmount));
  const [offline, setOffline] = useState(moneyInput(draft.offlineRaisedAmount));
  const [goal, setGoal] = useState(moneyInput(draft.goalAmount));
  const [ask, setAsk] = useState(String(draft.suggestedAskPerChild));
  const [thermometerVisible, setThermometerVisible] = useState(draft.thermometerVisible);
  const [milestones, setMilestones] = useState<MilestoneForm[]>(() =>
    milestonesToForm(draft.milestones),
  );
  const [baseline, setBaseline] = useState(() =>
    formSnapshot({
      ask: String(draft.suggestedAskPerChild),
      goal: moneyInput(draft.goalAmount),
      milestones: milestonesToForm(draft.milestones),
      offline: moneyInput(draft.offlineRaisedAmount),
      online: moneyInput(draft.onlineRaisedAmount),
      schoolYear: draft.schoolYear,
      thermometerVisible: draft.thermometerVisible,
      title: draft.title,
    }),
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(source === 'database');

  const submission = {
    goalAmount: goal,
    milestones: milestones.map((milestone) => ({
      amount: milestone.amount,
      description: milestone.description,
      id: milestone.id,
      label: milestone.label,
      targetDate: milestone.targetDate,
    })),
    offlineRaisedAmount: offline,
    onlineRaisedAmount: online,
    schoolYear,
    suggestedAskPerChild: ask,
    thermometerVisible,
    title,
  };
  const parsed = parseAnnualFundSubmission(submission);
  const preview = parsed.ok ? campaignFromDraft(parsed.draft) : null;
  const onlineAmount = parseMoney(online);
  const offlineAmount = parseMoney(offline);
  const raisedPreview =
    onlineAmount != null && offlineAmount != null ? onlineAmount + offlineAmount : null;
  const currentSnapshot = formSnapshot({
    ask,
    goal,
    milestones,
    offline,
    online,
    schoolYear,
    thermometerVisible,
    title,
  });
  const isDirty = currentSnapshot !== baseline;

  const updateMilestone = (index: number, patch: Partial<MilestoneForm>) => {
    setMilestones((current) =>
      current.map((milestone, milestoneIndex) =>
        milestoneIndex === index ? {...milestone, ...patch} : milestone,
      ),
    );
    setSaved(false);
  };

  const moveMilestone = (index: number, direction: -1 | 1) => {
    setMilestones((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(nextIndex, 0, moved);
      return next;
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/annual-fund', {
        body: JSON.stringify(submission),
        headers: {'Content-Type': 'application/json'},
        method: 'POST',
      });
      const data = (await res.json().catch(() => ({}))) as {error?: string};
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setBaseline(currentSnapshot);
      setPublished(true);
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-white">
      <header className="bg-gradient-to-r from-eagle-blue to-night-blue shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl md:text-2xl font-heading font-bold text-white">Annual Fund</h1>
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
              href="/admin/budgets"
            >
              Budgets
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

      <main className="max-w-5xl mx-auto px-4 py-8 pb-28 space-y-8">
        <p className="text-sm text-gray-600 font-body max-w-2xl">
          Publish the thermometer without a deploy. Enter the Cheddar Up total and offline gifts
          that have been deposited and cleared. Raised is always those two added together. Milestone
          amounts are cumulative thresholds toward the goal; the public card shows each step as the
          difference from the one before it.
        </p>

        {!published && (
          <p className="text-sm text-gray-600 font-body max-w-2xl">
            The site is still using the amounts shipped in code. The first save publishes this
            campaign from admin. Later deploys will not overwrite it.
          </p>
        )}

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-heading font-semibold text-charcoal">Totals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-body">
            <div>
              <label className="block font-medium text-charcoal mb-1" htmlFor="online-raised">
                Online total
              </label>
              <input
                className={fieldClass}
                id="online-raised"
                inputMode="decimal"
                onChange={(event) => {
                  setOnline(event.target.value);
                  setSaved(false);
                }}
                type="text"
                value={online}
              />
              <p className="mt-1 text-gray-500">Cheddar Up. Keep cents when the export has them.</p>
            </div>
            <div>
              <label className="block font-medium text-charcoal mb-1" htmlFor="offline-raised">
                Offline total
              </label>
              <input
                className={fieldClass}
                id="offline-raised"
                inputMode="decimal"
                onChange={(event) => {
                  setOffline(event.target.value);
                  setSaved(false);
                }}
                type="text"
                value={offline}
              />
              <p className="mt-1 text-gray-500">Deposited and cleared gifts only.</p>
            </div>
            <div>
              <label className="block font-medium text-charcoal mb-1" htmlFor="goal-amount">
                Goal
              </label>
              <input
                className={fieldClass}
                id="goal-amount"
                inputMode="decimal"
                onChange={(event) => {
                  setGoal(event.target.value);
                  setSaved(false);
                }}
                type="text"
                value={goal}
              />
            </div>
            <div>
              <label className="block font-medium text-charcoal mb-1" htmlFor="suggested-ask">
                Suggested ask per child
              </label>
              <input
                className={fieldClass}
                id="suggested-ask"
                inputMode="numeric"
                onChange={(event) => {
                  setAsk(event.target.value);
                  setSaved(false);
                }}
                type="text"
                value={ask}
              />
            </div>
            <div className="sm:col-span-2">
              <label
                className="flex items-start gap-3 text-sm font-body text-charcoal"
                htmlFor="thermometer-visible"
              >
                <input
                  checked={thermometerVisible}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-eagle-blue focus:ring-eagle-blue"
                  id="thermometer-visible"
                  onChange={(event) => {
                    setThermometerVisible(event.target.checked);
                    setSaved(false);
                  }}
                  type="checkbox"
                />
                <span>
                  <span className="font-medium">Show thermometer on the site</span>
                  <span className="mt-1 block text-gray-500">
                    When unchecked, the progress block is hidden on the Annual Fund page, Get
                    Involved, and the homepage. Give links stay. This admin preview always shows.
                  </span>
                </span>
              </label>
            </div>
            <div>
              <p className="font-medium text-charcoal mb-1">Raised</p>
              <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-charcoal">
                {raisedPreview == null ? '—' : formatCurrency(raisedPreview)}
              </p>
            </div>
            <div>
              <p className="font-medium text-charcoal mb-1">Last updated</p>
              <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-charcoal">
                {parsed.ok ? parsed.draft.lastUpdated : draft.lastUpdated} on save (Austin date)
              </p>
            </div>
            <div>
              <label className="block font-medium text-charcoal mb-1" htmlFor="school-year">
                School year
              </label>
              <input
                className={fieldClass}
                id="school-year"
                onChange={(event) => {
                  setSchoolYear(event.target.value);
                  setSaved(false);
                }}
                type="text"
                value={schoolYear}
              />
            </div>
            <div>
              <label className="block font-medium text-charcoal mb-1" htmlFor="campaign-title">
                Title
              </label>
              <input
                className={fieldClass}
                id="campaign-title"
                onChange={(event) => {
                  setTitle(event.target.value);
                  setSaved(false);
                }}
                type="text"
                value={title}
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-heading font-semibold text-charcoal">Milestones</h2>
            <button
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-charcoal shadow-sm hover:bg-gray-50 disabled:opacity-50 font-body"
              disabled={milestones.length >= 6}
              onClick={() => {
                const goalAmount = parseMoney(goal) ?? 0;
                setMilestones((current) => [
                  ...current,
                  {
                    amount: goalAmount > 0 ? moneyInput(goalAmount) : '',
                    description: '',
                    id: nextMilestoneId(current),
                    label: '',
                    targetDate: '',
                  },
                ]);
                setSaved(false);
              }}
              type="button"
            >
              Add milestone
            </button>
          </div>
          <ul className="space-y-4">
            {milestones.map((milestone, index) => {
              const previous = index === 0 ? 0 : (parseMoney(milestones[index - 1].amount) ?? 0);
              const amount = parseMoney(milestone.amount);
              const tranche = amount == null ? null : amount - previous;
              return (
                <li className="rounded-lg border border-gray-200 p-4 space-y-3" key={milestone.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-heading font-semibold text-charcoal">
                      {index + 1}
                      {tranche != null && amount != null
                        ? ` · shows ${formatCurrency(tranche)} (cumulative ${formatCurrency(amount)})`
                        : ''}
                    </p>
                    <div className="flex gap-2">
                      <button
                        className="text-sm text-eagle-blue underline underline-offset-2 disabled:opacity-40 font-body"
                        disabled={index === 0}
                        onClick={() => moveMilestone(index, -1)}
                        type="button"
                      >
                        Up
                      </button>
                      <button
                        className="text-sm text-eagle-blue underline underline-offset-2 disabled:opacity-40 font-body"
                        disabled={index === milestones.length - 1}
                        onClick={() => moveMilestone(index, 1)}
                        type="button"
                      >
                        Down
                      </button>
                      <button
                        className="text-sm text-red-700 underline underline-offset-2 disabled:opacity-40 font-body"
                        disabled={milestones.length === 1}
                        onClick={() => {
                          setMilestones((current) =>
                            current.filter((item) => item.id !== milestone.id),
                          );
                          setSaved(false);
                        }}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-body">
                    <div className="sm:col-span-2">
                      <label
                        className="block font-medium text-charcoal mb-1"
                        htmlFor={`milestone-label-${milestone.id}`}
                      >
                        Label
                      </label>
                      <input
                        className={fieldClass}
                        id={`milestone-label-${milestone.id}`}
                        onChange={(event) => updateMilestone(index, {label: event.target.value})}
                        type="text"
                        value={milestone.label}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label
                        className="block font-medium text-charcoal mb-1"
                        htmlFor={`milestone-description-${milestone.id}`}
                      >
                        Description
                      </label>
                      <input
                        className={fieldClass}
                        id={`milestone-description-${milestone.id}`}
                        onChange={(event) =>
                          updateMilestone(index, {description: event.target.value})
                        }
                        type="text"
                        value={milestone.description}
                      />
                    </div>
                    <div>
                      <label
                        className="block font-medium text-charcoal mb-1"
                        htmlFor={`milestone-amount-${milestone.id}`}
                      >
                        Cumulative amount
                      </label>
                      <input
                        className={fieldClass}
                        id={`milestone-amount-${milestone.id}`}
                        inputMode="decimal"
                        onChange={(event) => updateMilestone(index, {amount: event.target.value})}
                        type="text"
                        value={milestone.amount}
                      />
                    </div>
                    <div>
                      <label
                        className="block font-medium text-charcoal mb-1"
                        htmlFor={`milestone-date-${milestone.id}`}
                      >
                        Target date
                      </label>
                      <input
                        className={fieldClass}
                        id={`milestone-date-${milestone.id}`}
                        onChange={(event) =>
                          updateMilestone(index, {targetDate: event.target.value})
                        }
                        type="date"
                        value={milestone.targetDate}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {!parsed.ok && (
            <p className="text-sm text-red-800 font-body" role="status">
              {parsed.error}
            </p>
          )}
          <p className="text-sm text-gray-500 font-body">
            The Cheddar Up give link stays in code. Suggested ask also updates the page description.
          </p>
        </section>

        {preview && (
          <section>
            <h2 className="text-lg font-heading font-semibold text-charcoal mb-3">Preview</h2>
            <FundraisingProgress campaign={preview} className="mt-0" />
          </section>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p
            className={`min-h-5 text-sm font-body ${
              error
                ? 'text-red-600'
                : saved && !isDirty
                  ? 'text-creek-green'
                  : isDirty
                    ? 'text-charcoal'
                    : 'text-gray-500'
            }`}
            role={error ? 'alert' : 'status'}
          >
            {error
              ? error
              : saved && !isDirty
                ? 'Published. Public pages use these numbers now.'
                : isDirty
                  ? parsed.ok
                    ? 'You have unsaved changes.'
                    : parsed.error
                  : 'No unsaved changes.'}
          </p>
          <button
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-eagle-blue px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-eagle-blue/90 font-body disabled:cursor-not-allowed disabled:opacity-50"
            disabled={saving || !isDirty || !parsed.ok}
            onClick={handleSave}
            type="button"
          >
            {saving ? 'Publishing…' : 'Publish thermometer'}
          </button>
        </div>
      </div>
    </div>
  );
}
