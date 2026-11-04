import {useMemo, useState} from 'react';

import {buildGiveCheckoutUrl} from '~/lib/give-checkout-url';

type GiveAmountFormProps = {
  ask: number;
  giveBaseUrl: string;
};

type Preset = 'one' | 'two' | 'full' | 'other';

export function GiveAmountForm({ask, giveBaseUrl}: GiveAmountFormProps) {
  const [preset, setPreset] = useState<Preset>('one');
  const [otherAmount, setOtherAmount] = useState('');
  const [frequency, setFrequency] = useState<'once' | 'monthly'>('once');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [students, setStudents] = useState('');
  const [employerMatch, setEmployerMatch] = useState(false);

  const amount = useMemo(() => {
    if (preset === 'one') return ask;
    if (preset === 'two') return ask * 2;
    if (preset === 'full') return 930;
    const parsed = Number.parseFloat(otherAmount);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [ask, otherAmount, preset]);

  const checkoutUrl = buildGiveCheckoutUrl({
    amount,
    baseUrl: giveBaseUrl,
    frequency,
    utmContent: 'give-form',
  });

  const presets: {id: Preset; label: string; sub: string}[] = [
    {id: 'one', label: `$${ask}`, sub: '1 child · suggested'},
    {id: 'two', label: `$${ask * 2}`, sub: '2 children'},
    {id: 'full', label: '$930', sub: 'full cost per student'},
    {id: 'other', label: 'Other', sub: 'Enter amount'},
  ];

  return (
    <form
      className="rounded-panel bg-bhe-card p-6 shadow-form md:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
      }}
    >
      <fieldset>
        <legend className="font-display text-lg font-bold text-bhe-ink">Choose an amount</legend>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {presets.map((p) => {
            const selected = preset === p.id;
            return (
              <button
                aria-pressed={selected}
                className={[
                  'flex min-h-16 flex-col items-start justify-center rounded-input border-2 px-4 py-3 text-left transition-colors',
                  selected
                    ? 'border-bhe-green bg-bhe-green text-bhe-on-green'
                    : 'border-bhe-border-input bg-bhe-card text-bhe-ink hover:border-bhe-green',
                ].join(' ')}
                key={p.id}
                onClick={() => setPreset(p.id)}
                type="button"
              >
                <span className="font-display text-xl font-extrabold">{p.label}</span>
                <span className={`text-xs ${selected ? 'text-bhe-on-green-muted' : 'text-bhe-muted'}`}>
                  {p.sub}
                </span>
              </button>
            );
          })}
        </div>
        {preset === 'other' ? (
          <div className="mt-3">
            <label className="block text-sm font-semibold text-bhe-ink" htmlFor="other-amount">
              Other amount (USD)
            </label>
            <input
              className="mt-1 w-full rounded-input border border-bhe-border-input px-4 py-3"
              id="other-amount"
              inputMode="decimal"
              min={1}
              onChange={(e) => setOtherAmount(e.target.value)}
              step="0.01"
              type="number"
              value={otherAmount}
            />
          </div>
        ) : null}
      </fieldset>

      <fieldset className="mt-6">
        <legend className="font-display text-lg font-bold text-bhe-ink">How often?</legend>
        <div
          className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-bhe-paper-2 p-1"
          role="group"
        >
          {(
            [
              {id: 'once', label: 'One time'},
              {id: 'monthly', label: 'Monthly'},
            ] as const
          ).map((opt) => {
            const selected = frequency === opt.id;
            return (
              <button
                aria-pressed={selected}
                className={[
                  'min-h-11 rounded-full px-4 py-2 text-sm font-bold transition-colors',
                  selected ? 'bg-bhe-green text-bhe-on-green' : 'text-bhe-muted hover:text-bhe-ink',
                ].join(' ')}
                key={opt.id}
                onClick={() => setFrequency(opt.id)}
                type="button"
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-bhe-ink" htmlFor="giver-name">
            Name
          </label>
          <input
            className="mt-1 w-full rounded-input border border-bhe-border-input px-4 py-3"
            id="giver-name"
            onChange={(e) => setName(e.target.value)}
            type="text"
            value={name}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-bhe-ink" htmlFor="giver-email">
            Email
          </label>
          <input
            className="mt-1 w-full rounded-input border border-bhe-border-input px-4 py-3"
            id="giver-email"
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            value={email}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-bhe-ink" htmlFor="giver-students">
            Student name(s) & grade — optional
          </label>
          <input
            className="mt-1 w-full rounded-input border border-bhe-border-input px-4 py-3"
            id="giver-students"
            onChange={(e) => setStudents(e.target.value)}
            type="text"
            value={students}
          />
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm text-bhe-ink">
          <input
            checked={employerMatch}
            className="h-5 w-5 rounded border-bhe-border-input"
            onChange={(e) => setEmployerMatch(e.target.checked)}
            type="checkbox"
          />
          My employer matches gifts
        </label>
      </div>

      <button
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-bhe-gold px-6 py-3.5 text-base font-extrabold text-bhe-green hover:brightness-95"
        type="submit"
      >
        Continue to payment
      </button>
      <p className="mt-3 text-center text-xs text-bhe-muted">
        Secure checkout via CheddarUp. Name, email and notes are collected on the payment site.
      </p>
    </form>
  );
}
