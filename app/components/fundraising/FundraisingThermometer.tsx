import type {FundraisingMilestone} from '~/data/annual-fund-campaign';
import {getMilestoneMarkerPercent} from '~/lib/fundraising/progress';

interface FundraisingThermometerProps {
  ariaLabel: string;
  goalAmount: number;
  isEmpty: boolean;
  milestones: FundraisingMilestone[];
  percent: number;
}

export function FundraisingThermometer({
  ariaLabel,
  goalAmount,
  isEmpty,
  milestones,
  percent,
}: FundraisingThermometerProps) {
  const fillWidth = Math.max(percent, isEmpty ? 0 : 3);
  const visibleMarkers = milestones.filter(
    (m) => getMilestoneMarkerPercent(m.amount, goalAmount) < 100,
  );

  return (
    <div className="flex items-end gap-2 sm:gap-3">
      <div className="min-w-0 flex-1 pb-1">
        <div
          aria-label={ariaLabel}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={percent}
          className="relative"
          role="progressbar"
        >
          <div
            aria-hidden="true"
            className="h-7 w-full overflow-hidden rounded-full bg-charcoal/10 shadow-inner sm:h-8"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-eagle-blue to-spirit-gold transition-[width] duration-500 ease-out"
              style={{width: `${fillWidth}%`}}
            />
          </div>

          {visibleMarkers.map((m) => (
            <div
              aria-hidden="true"
              className="absolute top-0 bottom-0 w-0.5 rounded-full bg-charcoal/30"
              key={m.id}
              style={{left: `${getMilestoneMarkerPercent(m.amount, goalAmount)}%`}}
            />
          ))}
        </div>
      </div>

      <img
        alt=""
        aria-hidden="true"
        className={`h-12 w-auto shrink-0 -scale-x-100 sm:h-16 ${isEmpty ? 'thermometer-eagle-pulse' : ''}`}
        src="/barton-hills-mascot.svg"
      />
    </div>
  );
}
