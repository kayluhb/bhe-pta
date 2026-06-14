import {DonationForm} from '~/components/donations/DonationForm';
import {getCampaign} from '~/data/campaigns';
import {nonprofit} from '~/data/nonprofit';
import {isPaymentsConfigured} from '~/lib/donations/provider';
import {mergeParentMeta} from '~/lib/meta';
import type {Route} from './+types/give.$slug';

export function meta({matches, params}: Route.MetaArgs) {
  const campaign = getCampaign(params.slug);
  const title = campaign ? `Give — ${campaign.title}` : 'Give';
  return mergeParentMeta(matches, [
    {title: `${title} | Barton Hills Elementary PTA`},
    {
      name: 'description',
      content: campaign
        ? `Make a tax-deductible contribution to ${campaign.title} at Barton Hills Elementary PTA.`
        : 'Support Barton Hills Elementary PTA.',
    },
  ]);
}

export async function loader({context, params}: Route.LoaderArgs) {
  const campaign = getCampaign(params.slug);
  if (!campaign) {
    throw new Response('Campaign not found', {status: 404});
  }

  return {
    campaign,
    paymentsEnabled: isPaymentsConfigured(context.cloudflare.env),
  };
}

export default function GiveCampaign({loaderData}: Route.ComponentProps) {
  const {campaign, paymentsEnabled} = loaderData;

  return (
    <div>
      <section className="relative bg-gradient-to-br from-eagle-blue to-night-blue py-16 md:py-24 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, transparent, transparent 60px, #d4a843 60px, #d4a843 62px)',
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <p className="text-spirit-gold font-heading font-bold text-sm uppercase tracking-wider">
            {campaign.schoolYear} school year
          </p>
          <h1 className="mt-2 text-4xl md:text-5xl font-heading font-bold text-white">
            {campaign.title}
          </h1>
          <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
            Your tax-deductible contribution supports students, teachers, and programs at Barton
            Hills Elementary.
          </p>
          <div className="mt-6 h-1 w-20 bg-spirit-gold rounded-full mx-auto" />
        </div>
      </section>

      <section className="bg-warm-white py-16 md:py-24">
        <div className="max-w-xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
            {!paymentsEnabled && (
              <div
                className="mb-6 rounded-lg border border-spirit-gold/40 bg-spirit-gold/10 px-4 py-3 text-sm text-charcoal"
                role="status"
              >
                Online giving is being set up. You can still contribute by check payable to BHE PTA
                in the school office mailbox.
              </div>
            )}
            <DonationForm campaign={campaign} paymentsEnabled={paymentsEnabled} />
          </div>
          <p className="mt-6 text-center text-xs text-charcoal/50">
            {nonprofit.legalName} · EIN {nonprofit.ein}
          </p>
        </div>
      </section>
    </div>
  );
}
