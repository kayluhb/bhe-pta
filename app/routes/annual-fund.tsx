import {Link} from 'react-router';

import {FundraisingProgress} from '~/components/fundraising/FundraisingProgress';
import {
  annualFundCampaign,
  annualFundGiveUrlWithUtm,
  corporateContributionsUrl,
} from '~/data/annual-fund-campaign';
import {formatCurrency} from '~/lib/fundraising/progress';
import {SITE_ORIGIN, pageSeoMeta} from '~/lib/meta';
import type {Route} from './+types/annual-fund';

const TAX_ID = '74-6086853';

const fundedInitiatives = [
  'Library, music, art, and PE materials',
  'Faculty supplies and training',
  'Student t-shirts and yearbooks',
  'Cultural arts programs',
  'Social-emotional learning',
  'Outdoor maintenance',
  'PE equipment',
  'HEPA filters',
  'Technology',
  'Academic enrichment',
  'School gardens',
];

const faqs = [
  {
    question: 'Is my donation tax-deductible?',
    answer:
      'Yes. Barton Hills Elementary PTA is a 501(c)(3) nonprofit (Tax ID 74-6086853). Your contribution is tax-deductible to the extent allowed by law.',
  },
  {
    question: 'How much should I give?',
    answer: `We request about $${annualFundCampaign.suggestedAskPerChild} per child to help sustain programs. Give what you can — every dollar funds Art, Music, PE, classroom resources, and community programs.`,
  },
  {
    question: 'Where does Annual Fund money go?',
    answer:
      'Gifts fund the final third of Music, Art, and PE roles, plus grants, enrichment, hospitality, cultural arts, and campus needs that AISD does not fully cover.',
  },
  {
    question: 'Is membership the same as donating?',
    answer:
      'Your Annual Fund gift includes PTA membership for the school year. One contribution supports both membership and the programs that serve every Eagle.',
  },
];

export async function loader() {
  return {annualFundCampaign};
}

export function meta({matches}: Route.MetaArgs) {
  const ask = annualFundCampaign.suggestedAskPerChild;
  return pageSeoMeta(matches, {
    path: '/annual-fund',
    title: 'Donate to the Annual Fund | Barton Hills Elementary PTA',
    description: `Donate to the Barton Hills Elementary PTA Annual Fund. Your gift funds Art, Music & PE, classroom programs, and resources for every student. 501(c)(3) Tax ID 74-6086853. Suggested $${ask} per child.`,
    ogTitle: 'Give to the BHE PTA Annual Fund',
    ogDescription:
      'Help fund Art, Music & PE and school programs. Tax-deductible gifts to Barton Hills Elementary PTA.',
  });
}

function OrganizationJsonLd({giveUrl}: {giveUrl: string}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NGO',
    name: 'Barton Hills Elementary PTA',
    alternateName: 'PTA Texas Congress Barton Hills Elementary',
    url: `${SITE_ORIGIN}/annual-fund`,
    logo: `${SITE_ORIGIN}/og-image.jpg`,
    email: 'pta@bheeagles.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '2108 Barton Hills Drive',
      addressLocality: 'Austin',
      addressRegion: 'TX',
      postalCode: '78704',
      addressCountry: 'US',
    },
    taxID: TAX_ID,
    nonprofitStatus: 'Nonprofit501c3',
    description:
      'Parent-teacher association supporting Barton Hills Elementary through fundraising, volunteers, and programs.',
    potentialAction: {
      '@type': 'DonateAction',
      name: 'Give to the Annual Fund',
      target: giveUrl,
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        dangerouslySetInnerHTML={{__html: JSON.stringify(schema)}}
        type="application/ld+json"
      />
      <script
        dangerouslySetInnerHTML={{__html: JSON.stringify(faqSchema)}}
        type="application/ld+json"
      />
    </>
  );
}

export default function AnnualFund({loaderData}: Route.ComponentProps) {
  const {annualFundCampaign: campaign} = loaderData;
  const giveUrl = annualFundGiveUrlWithUtm('annual-fund-page');

  return (
    <div>
      <OrganizationJsonLd giveUrl={giveUrl} />

      <section className="relative overflow-hidden bg-gradient-to-br from-eagle-blue to-night-blue py-16 md:py-24">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, transparent, transparent 60px, #d4a843 60px, #d4a843 62px)',
          }}
        />
        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center">
          <p className="font-heading text-sm font-bold uppercase tracking-wider text-spirit-gold">
            {campaign.schoolYear} Annual Fund
          </p>
          <h1 className="mt-3 font-heading text-4xl font-bold text-white md:text-5xl lg:text-6xl">
            Give to Barton Hills Elementary PTA
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90 md:text-xl">
            Tax-deductible gifts fund Art, Music &amp; PE and the programs every Eagle relies on.
            Suggested contribution: ${campaign.suggestedAskPerChild} per child.
          </p>
          <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-spirit-gold" />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              className="inline-flex items-center rounded-full border-2 border-spirit-gold bg-spirit-gold px-8 py-3.5 font-heading text-lg font-bold text-night-blue transition-colors hover:bg-white"
              href={giveUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Give now
              <span className="sr-only"> (opens in new tab)</span>
            </a>
            <a
              className="inline-flex items-center rounded-full border-2 border-white/70 px-8 py-3.5 font-heading text-lg font-bold text-white transition-colors hover:bg-white/10"
              href="#progress"
            >
              See progress
            </a>
          </div>
          <p className="mt-6 text-sm text-white/70">
            501(c)(3) nonprofit · Tax ID {TAX_ID} · Goal {formatCurrency(campaign.goalAmount)}
          </p>
        </div>
      </section>

      <section className="bg-warm-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-heading text-3xl font-bold text-charcoal md:text-4xl">
                Why your gift matters
              </h2>
              <div className="mt-3 h-1 w-16 rounded-full bg-spirit-gold" />
              <p className="mt-6 text-lg leading-relaxed text-charcoal/70">
                The PTA invests about{' '}
                <span className="font-bold text-charcoal">$930 per student</span> each year in
                programs and resources AISD does not fully fund. Your Annual Fund gift keeps Music,
                Art, and PE staffed and fuels enrichment for every classroom.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-8 shadow-lg">
              <h3 className="font-heading text-lg font-bold text-charcoal">Your contributions fund</h3>
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {fundedInitiatives.map((item) => (
                  <li className="flex items-start gap-2 text-charcoal/70" key={item}>
                    <svg
                      aria-hidden="true"
                      className="mt-0.5 h-5 w-5 shrink-0 text-creek-green"
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
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-charcoal/5 bg-white py-16 md:py-20" id="progress">
        <div className="mx-auto max-w-7xl px-4">
          <FundraisingProgress campaign={campaign} className="mt-0" />
          <div className="mt-10">
            <a
              className="inline-flex items-center rounded-full border-2 border-spirit-gold bg-spirit-gold px-8 py-3.5 font-heading text-lg font-bold text-night-blue transition-colors hover:bg-white"
              href={giveUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Give to the Annual Fund
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          </div>
        </div>
      </section>

      <section className="bg-warm-white py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center font-heading text-3xl font-bold text-charcoal md:text-4xl">
            Common questions
          </h2>
          <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-spirit-gold" />
          <dl className="mt-10 space-y-6">
            {faqs.map((faq) => (
              <div className="rounded-xl border border-charcoal/10 bg-white p-6" key={faq.question}>
                <dt className="font-heading text-lg font-bold text-charcoal">{faq.question}</dt>
                <dd className="mt-2 leading-relaxed text-charcoal/70">{faq.answer}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 text-center text-sm text-charcoal/60">
            Official organization details:{' '}
            <Link className="font-medium text-eagle-blue hover:text-spirit-gold" to="/official-name">
              name, mission, and Tax ID
            </Link>
          </p>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="rounded-2xl bg-gradient-to-r from-eagle-blue to-night-blue p-8 text-center md:p-12">
            <h2 className="font-heading text-3xl font-bold text-white md:text-4xl">
              Local business sponsorships
            </h2>
            <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-spirit-gold" />
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/90">
              Businesses can support Barton Hills through fence-sign sponsorships that fund the same
              student programs.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                className="inline-flex items-center rounded-full border-2 border-spirit-gold bg-spirit-gold px-8 py-3.5 font-heading text-lg font-bold text-night-blue transition-colors hover:bg-white"
                href={corporateContributionsUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                Become a sponsor
                <span className="sr-only"> (opens in new tab)</span>
              </a>
              <Link
                className="inline-flex items-center rounded-full border-2 border-white px-8 py-3.5 font-heading text-lg font-bold text-white transition-colors hover:bg-white/10"
                to="/sponsors"
              >
                View sponsor tiers
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-warm-white py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-lg text-charcoal/70">
            Ready to give? Every contribution moves us toward {formatCurrency(campaign.goalAmount)}{' '}
            for {campaign.schoolYear}.
          </p>
          <a
            className="mt-6 inline-flex items-center rounded-full border-2 border-spirit-gold bg-spirit-gold px-8 py-3.5 font-heading text-lg font-bold text-night-blue transition-colors hover:bg-white"
            href={giveUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Give now
            <span className="sr-only"> (opens in new tab)</span>
          </a>
        </div>
      </section>
    </div>
  );
}
