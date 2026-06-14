import {Link} from 'react-router';

import {campaignGivePath, getCampaign} from '~/data/campaigns';
import {nonprofit} from '~/data/nonprofit';
import {mergeParentMeta} from '~/lib/meta';
import type {Route} from './+types/give.$slug.success';

export function meta({matches, params}: Route.MetaArgs) {
  const campaign = getCampaign(params.slug);
  const title = campaign ? `Thank you — ${campaign.title}` : 'Thank you';
  return mergeParentMeta(matches, [{title: `${title} | Barton Hills Elementary PTA`}]);
}

export async function loader({params}: Route.LoaderArgs) {
  const campaign = getCampaign(params.slug);
  if (!campaign) {
    throw new Response('Campaign not found', {status: 404});
  }
  return {campaign};
}

export default function GiveSuccess({loaderData}: Route.ComponentProps) {
  const {campaign} = loaderData;

  return (
    <div>
      <section className="bg-warm-white py-24 md:py-32">
        <div className="max-w-xl mx-auto px-4 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-creek-green/10 mb-6">
            <svg
              aria-hidden="true"
              className="h-8 w-8 text-creek-green"
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
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-charcoal">
            Thank you for your gift!
          </h1>
          <p className="mt-4 text-lg text-charcoal/70 leading-relaxed">
            Your contribution to {campaign.title} makes a real difference for our school community.
            A tax receipt has been sent to your email from {nonprofit.shortName}.
          </p>
          <p className="mt-3 text-sm text-charcoal/60">
            {nonprofit.legalName} · EIN {nonprofit.ein}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              className="inline-flex items-center bg-spirit-gold text-night-blue font-heading font-bold px-6 py-2.5 rounded-full hover:bg-spirit-gold/90 transition-colors"
              to="/get-involved"
            >
              See campaign progress
            </Link>
            <Link
              className="inline-flex items-center border-2 border-eagle-blue text-eagle-blue font-heading font-bold px-6 py-2.5 rounded-full hover:bg-eagle-blue/5 transition-colors"
              to="/"
            >
              Back to home
            </Link>
          </div>
          <p className="mt-8 text-sm text-charcoal/50">
            <Link className="underline hover:text-charcoal" to={campaignGivePath(campaign.slug)}>
              Make another contribution
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
