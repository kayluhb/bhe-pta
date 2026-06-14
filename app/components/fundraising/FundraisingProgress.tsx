import type {CampaignProgress} from '~/data/campaigns/types';
import {
  formatCurrency,
  getMilestoneMarkerPercent,
  getMilestoneStatus,
  getProgressPercent,
} from '~/lib/fundraising/progress';

interface FundraisingProgressProps {
  campaign: CampaignProgress;
}

export function FundraisingProgress({campaign}: FundraisingProgressProps) {
  const percent = getProgressPercent(campaign.raisedAmount, campaign.goalAmount);
  const milestoneStatus = getMilestoneStatus(campaign.raisedAmount, campaign.milestones);
  const statusById = Object.fromEntries(milestoneStatus.map((s) => [s.id, s.reached]));
  const isEmpty = campaign.raisedAmount === 0;

  return (
    <div className="mt-8 rounded-xl border border-charcoal/10 bg-warm-white/50 p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="font-heading font-bold text-lg text-charcoal">
            {formatCurrency(campaign.raisedAmount)} of {formatCurrency(campaign.goalAmount)}
          </p>
          <p className="text-sm text-charcoal/60 mt-1">
            Last updated {campaign.lastUpdated}
          </p>
        </div>
        <p className="text-3xl font-heading font-bold text-eagle-blue">{percent}%</p>
      </div>

      <div className="relative mt-5">
        <div aria-hidden="true" className="h-4 w-full overflow-hidden rounded-full bg-charcoal/10">
          <div
            className="h-4 rounded-full bg-eagle-blue transition-[width] duration-500 ease-out"
            style={{width: `${Math.max(percent, isEmpty ? 0 : 3)}%`}}
          />
        </div>
        {campaign.milestones.map((m) => (
          <div
            aria-hidden="true"
            className="absolute top-0 bottom-0 w-0.5 bg-charcoal/25"
            key={m.id}
            style={{left: `${getMilestoneMarkerPercent(m.amount, campaign.goalAmount)}%`}}
          />
        ))}
      </div>

      {isEmpty && (
        <p className="mt-4 text-charcoal/70 text-sm">
          Our Annual Fund campaign is underway — be among the first to give!
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {campaign.milestones.map((m) => {
          const reached = statusById[m.id] ?? false;
          return (
            <li className="flex items-start gap-3" key={m.id}>
              <svg
                aria-hidden="true"
                className={`h-5 w-5 shrink-0 mt-0.5 ${reached ? 'text-creek-green' : 'text-charcoal/30'}`}
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
                <p className={`font-heading font-bold ${reached ? 'text-charcoal' : 'text-charcoal/70'}`}>
                  {m.label}
                  <span className="font-normal text-charcoal/60"> — {formatCurrency(m.amount)}</span>
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
