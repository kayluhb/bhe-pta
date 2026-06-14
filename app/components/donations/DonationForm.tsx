import {useState} from 'react';

import type {CampaignConfig} from '~/data/campaigns/types';
import {useTurnstile} from '~/hooks/useTurnstile';

interface DonationFormProps {
  campaign: CampaignConfig;
  paymentsEnabled: boolean;
}

function formatPresetDollars(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(cents / 100);
}

export function DonationForm({campaign, paymentsEnabled}: DonationFormProps) {
  const {containerRef, reset, token} = useTurnstile();
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorFields, setDonorFields] = useState<Record<string, string>>(() =>
    Object.fromEntries(campaign.donorFields.map((f) => [f.id, ''])),
  );
  const [presetId, setPresetId] = useState<string | null>(campaign.presetAmounts[0]?.id ?? null);
  const [customAmount, setCustomAmount] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resolvedAmountCents = (() => {
    if (useCustom && campaign.allowCustomAmount) {
      const dollars = Number.parseFloat(customAmount);
      if (!Number.isFinite(dollars) || dollars <= 0) return null;
      return Math.round(dollars * 100);
    }
    const preset = campaign.presetAmounts.find((p) => p.id === presetId);
    return preset?.amountCents ?? null;
  })();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!paymentsEnabled) {
      setError('Online donations are not available yet. Please check back soon.');
      return;
    }

    if (!token) {
      setError('Please complete the verification challenge.');
      return;
    }

    if (resolvedAmountCents == null) {
      setError('Please select or enter a valid contribution amount.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/donations/checkout', {
        body: JSON.stringify({
          amountCents: resolvedAmountCents,
          campaignSlug: campaign.slug,
          donorEmail,
          donorFields,
          donorName,
          presetId: useCustom ? null : presetId,
          turnstileToken: token,
        }),
        headers: {'Content-Type': 'application/json'},
        method: 'POST',
      });

      const data = (await res.json()) as {error?: string; url?: string};
      if (!res.ok) {
        setError(data.error ?? 'Unable to start checkout. Please try again.');
        reset();
        setSubmitting(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setError('Unable to start checkout. Please try again.');
      reset();
    } catch {
      setError('Network error. Please try again.');
      reset();
    }
    setSubmitting(false);
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <p className="font-heading font-bold text-charcoal mb-3">Choose an amount</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {campaign.presetAmounts.map((preset) => (
            <button
              className={`rounded-xl border-2 px-4 py-3 text-left font-heading font-bold transition-colors ${
                !useCustom && presetId === preset.id
                  ? 'border-eagle-blue bg-eagle-blue/5 text-eagle-blue'
                  : 'border-charcoal/15 text-charcoal hover:border-eagle-blue/40'
              }`}
              key={preset.id}
              onClick={() => {
                setUseCustom(false);
                setPresetId(preset.id);
              }}
              type="button"
            >
              {preset.label}
              <span className="block text-sm font-normal text-charcoal/60 mt-0.5">
                {formatPresetDollars(preset.amountCents)}
              </span>
            </button>
          ))}
        </div>
        {campaign.allowCustomAmount && (
          <div className="mt-4">
            <label className="flex items-center gap-2 text-sm text-charcoal/70">
              <input
                checked={useCustom}
                className="rounded border-charcoal/30 text-eagle-blue focus:ring-eagle-blue"
                onChange={(e) => setUseCustom(e.target.checked)}
                type="checkbox"
              />
              Other amount
            </label>
            {useCustom && (
              <div className="mt-2 relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/50">$</span>
                <input
                  className="w-full rounded-lg border border-charcoal/20 pl-7 pr-3 py-2.5 focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue"
                  min={campaign.minAmountCents / 100}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter amount"
                  step="1"
                  type="number"
                  value={customAmount}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <p className="font-heading font-bold text-charcoal">Your information</p>
        <div>
          <label className="block text-sm font-medium text-charcoal/70 mb-1" htmlFor="donorName">
            Full name
          </label>
          <input
            className="w-full rounded-lg border border-charcoal/20 px-3 py-2.5 focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue"
            id="donorName"
            onChange={(e) => setDonorName(e.target.value)}
            required
            type="text"
            value={donorName}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal/70 mb-1" htmlFor="donorEmail">
            Email (for your tax receipt)
          </label>
          <input
            className="w-full rounded-lg border border-charcoal/20 px-3 py-2.5 focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue"
            id="donorEmail"
            onChange={(e) => setDonorEmail(e.target.value)}
            required
            type="email"
            value={donorEmail}
          />
        </div>
        {campaign.donorFields.map((field) => (
          <div key={field.id}>
            <label className="block text-sm font-medium text-charcoal/70 mb-1" htmlFor={field.id}>
              {field.label}
            </label>
            <input
              className="w-full rounded-lg border border-charcoal/20 px-3 py-2.5 focus:border-eagle-blue focus:ring-1 focus:ring-eagle-blue"
              id={field.id}
              maxLength={field.maxLength ?? 200}
              onChange={(e) => setDonorFields((prev) => ({...prev, [field.id]: e.target.value}))}
              required={field.required}
              type={field.type === 'email' ? 'email' : 'text'}
              value={donorFields[field.id] ?? ''}
            />
          </div>
        ))}
      </div>

      <div ref={containerRef} />

      {error && (
        <p className="text-red-600 text-sm" role="alert">
          {error}
        </p>
      )}

      <button
        className="inline-flex items-center bg-spirit-gold text-night-blue font-heading font-bold text-lg px-8 py-3.5 rounded-full hover:bg-spirit-gold/90 transition-all duration-200 hover:shadow-lg hover:shadow-spirit-gold/25 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={submitting}
        type="submit"
      >
        {submitting ? 'Redirecting…' : 'Continue to secure payment'}
      </button>

      <p className="text-xs text-charcoal/50">
        You will be redirected to our secure payment processor to complete your tax-deductible
        contribution. Barton Hills Elementary PTA (EIN 74-6086853) is a 501(c)(3) nonprofit.
      </p>
    </form>
  );
}
