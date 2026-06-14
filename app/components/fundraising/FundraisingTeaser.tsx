import {Link} from 'react-router';

import type {AnnualFundCampaign} from '~/data/annual-fund-campaign';
import {formatCurrency, getProgressPercent} from '~/lib/fundraising/progress';

interface FundraisingTeaserProps {
  campaign: AnnualFundCampaign;
}

export function FundraisingTeaser({campaign}: FundraisingTeaserProps) {
  const percent = getProgressPercent(campaign.raisedAmount, campaign.goalAmount);
  const isEmpty = campaign.raisedAmount === 0;

  return (
    <section className="bg-white py-16 md:py-20 border-y border-charcoal/5">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-br from-eagle-blue to-night-blue rounded-2xl shadow-xl p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-spirit-gold font-heading font-bold text-sm uppercase tracking-wider">
                {campaign.title}
              </p>
              <h2 className="mt-2 text-2xl md:text-3xl font-heading font-bold text-white">
                {isEmpty ? 'Our campaign is underway' : `${formatCurrency(campaign.raisedAmount)} raised`}
              </h2>
              <p className="mt-2 text-white/80 text-sm">
                Goal: {formatCurrency(campaign.goalAmount)} · {campaign.schoolYear} school year
              </p>
            </div>
            <p className="text-4xl font-heading font-bold text-spirit-gold shrink-0">{percent}%</p>
          </div>

          <div aria-hidden="true" className="mt-6 h-3 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-3 rounded-full bg-spirit-gold transition-[width] duration-500 ease-out"
              style={{width: `${Math.max(percent, isEmpty ? 0 : 3)}%`}}
            />
          </div>

          {isEmpty && (
            <p className="mt-4 text-white/90 text-sm">
              Be among the first families to contribute this school year.
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              className="inline-flex items-center bg-spirit-gold text-night-blue font-heading font-bold text-sm px-6 py-2.5 rounded-full hover:bg-spirit-gold/90 transition-colors"
              to="/get-involved"
            >
              See progress
            </Link>
            <a
              className="inline-flex items-center border-2 border-white/60 text-white font-heading font-bold text-sm px-6 py-2.5 rounded-full hover:bg-white/10 transition-colors"
              href={campaign.giveUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Give now
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
