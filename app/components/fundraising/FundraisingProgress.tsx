import type {AnnualFundCampaign} from '~/data/annual-fund-campaign';
import {
  formatCurrency,
  getMilestoneStatus,
  getProgressPercent,
} from '~/lib/fundraising/progress';

import {FundraisingThermometer} from './FundraisingThermometer';

interface FundraisingProgressProps {
  campaign: AnnualFundCampaign;
  className?: string;
}

export function FundraisingProgress({campaign, className}: FundraisingProgressProps) {
  const percent = getProgressPercent(campaign.raisedAmount, campaign.goalAmount);
  const milestoneStatus = getMilestoneStatus(campaign.raisedAmount, campaign.milestones);
  const statusById = Object.fromEntries(milestoneStatus.map((s) => [s.id, s.reached]));
  const isEmpty = campaign.raisedAmount === 0;

  return (
    <div
      className={`rounded-xl border border-charcoal/10 bg-warm-white/50 p-6 shadow-sm md:p-8 ${className ?? 'mt-8'}`}
    >
      <h2 className="font-heading font-bold text-xl text-charcoal md:text-2xl">
        {campaign.title}
      </h2>
      <div aria-hidden="true" className="mt-2 h-1 w-12 rounded-full bg-spirit-gold" />

      <div className="mt-4">
        <p className="font-heading font-bold text-lg text-charcoal">
          {formatCurrency(campaign.raisedAmount)} of {formatCurrency(campaign.goalAmount)}
        </p>
        <p className="mt-1 text-sm text-charcoal/60">Last updated {campaign.lastUpdated}</p>
      </div>

      <div className="mt-4 flex items-end gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <FundraisingThermometer
            ariaLabel={campaign.title}
            goalAmount={campaign.goalAmount}
            isEmpty={isEmpty}
            milestones={campaign.milestones}
            percent={percent}
          />
        </div>
        <p className="shrink-0 pb-2 font-heading font-bold text-2xl text-spirit-gold sm:text-3xl">
          {percent}%
        </p>
      </div>

      {isEmpty && (
        <p className="mt-4 text-sm text-charcoal/70">
          Our eagle is ready to soar — help us hit the first milestone!
        </p>
      )}

      <ul aria-live="polite" className="mt-6 space-y-3">
        {campaign.milestones.map((m, index) => {
          const reached = statusById[m.id] ?? false;
          return (
            <li
              className={`flex items-start gap-3 rounded-lg border p-3 ${
                reached
                  ? 'border-creek-green/30 border-l-4 border-l-creek-green bg-creek-green/5'
                  : 'border-charcoal/10 bg-white/60'
              }`}
              key={m.id}
            >
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-spirit-gold/25 font-heading text-xs font-bold text-charcoal"
              >
                {index + 1}
              </span>
              <svg
                aria-hidden="true"
                className={`mt-0.5 h-5 w-5 shrink-0 ${reached ? 'text-creek-green' : 'text-charcoal/30'}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <p
                  className={`font-heading font-bold ${reached ? 'text-charcoal' : 'text-charcoal/70'}`}
                >
                  {m.label}
                  <span className="font-normal text-charcoal/60"> — {formatCurrency(m.amount)}</span>
                  {reached && <span className="sr-only"> — reached</span>}
                </p>
                <p className="text-sm text-charcoal/60">{m.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
