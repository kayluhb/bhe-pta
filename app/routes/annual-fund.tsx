import {Link} from 'react-router';

import {GiveAmountForm} from '~/components/annual-fund/GiveAmountForm';
import {Button} from '~/components/ui/Button';
import {Container} from '~/components/ui/Container';
import {GreenBand} from '~/components/ui/GreenBand';
import {
  annualFundCampaign,
  annualFundGiveUrl,
  corporateContributionsUrl,
} from '~/data/annual-fund-campaign';
import {getCloudflare} from '~/lib/cloudflare-context';
import {loadPublishedCampaign} from '~/lib/fundraising/campaign-store';
import {pageSeoMeta, SITE_ORIGIN} from '~/lib/meta';
import {formatSchoolYearLong} from '~/lib/school-year';
import type {Route} from './+types/annual-fund';

const TAX_ID = '74-6086853';

const fundedInitiatives = [
  'Library, music, art and PE materials',
  'Faculty supplies and training',
  'Student t-shirts and yearbooks',
  'Cultural arts',
  'Social-emotional learning',
  'Outdoor maintenance',
  'PE equipment',
  'HEPA filters',
  'Technology',
  'Academic enrichment',
  'School gardens',
];

function annualFundFaqs(ask: number) {
  return [
    {
      question: `Why $${ask} per child?`,
      answer: `We suggest about $${ask} per child to help sustain programs that AISD does not fully fund. Give what you can — every dollar supports Art, Music, PE, classroom resources, and community programs.`,
    },
    {
      question: 'Is my gift tax-deductible?',
      answer: `Yes. Barton Hills Elementary PTA is a 501(c)(3) nonprofit (Tax ID ${TAX_ID}). Your contribution is tax-deductible to the extent allowed by law.`,
    },
    {
      question: 'Does this include PTA membership?',
      answer:
        'Yes. Your Annual Fund gift includes PTA membership for the school year. One contribution supports both membership and the programs that serve every Eagle.',
    },
    {
      question: 'Need a reimbursement?',
      answer:
        'Volunteers and staff can submit a reimbursement request for PTA-approved expenses. Visit the reimbursement form for details.',
    },
  ];
}

export async function loader({context}: Route.LoaderArgs) {
  try {
    const campaign = await loadPublishedCampaign(getCloudflare(context).env.REIMBURSEMENT_DB);
    return {annualFundCampaign: campaign};
  } catch {
    return {annualFundCampaign};
  }
}

export function meta({loaderData, matches}: Route.MetaArgs) {
  const ask =
    loaderData?.annualFundCampaign.suggestedAskPerChild ?? annualFundCampaign.suggestedAskPerChild;
  return pageSeoMeta(matches, {
    path: '/annual-fund',
    title: 'Donate to the Annual Fund | Barton Hills Elementary PTA',
    description: `Donate to the Barton Hills Elementary PTA Annual Fund. Your gift funds Art, Music & PE, classroom programs, and resources for every student. 501(c)(3) Tax ID 74-6086853. Suggested $${ask} per child.`,
    ogTitle: 'Give to the BHE PTA Annual Fund',
    ogDescription:
      'Help fund Art, Music & PE and school programs. Tax-deductible gifts to Barton Hills Elementary PTA.',
  });
}

function OrganizationJsonLd({
  faqs,
  giveUrl,
}: {
  faqs: {answer: string; question: string}[];
  giveUrl: string;
}) {
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
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD built from our own campaign fields.
        dangerouslySetInnerHTML={{__html: JSON.stringify(schema)}}
        type="application/ld+json"
      />
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD built from our own campaign fields.
        dangerouslySetInnerHTML={{__html: JSON.stringify(faqSchema)}}
        type="application/ld+json"
      />
    </>
  );
}

export default function AnnualFund({loaderData}: Route.ComponentProps) {
  const {annualFundCampaign: campaign} = loaderData;
  const ask = campaign.suggestedAskPerChild;
  const faqs = annualFundFaqs(ask);
  const giveUrl = campaign.giveUrl || annualFundGiveUrl;

  return (
    <div>
      <OrganizationJsonLd faqs={faqs} giveUrl={giveUrl} />

      <section className="py-12 md:py-[72px]">
        <Container className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14">
          <div className="flex-1">
            <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-bhe-green-2">
              {formatSchoolYearLong(campaign.schoolYear)} Annual Fund
            </p>
            <h1 className="mt-4 font-display text-[46px] font-extrabold leading-[0.98] tracking-[-0.035em] text-bhe-ink md:text-[clamp(48px,5.5vw,80px)]">
              One gift funds a whole year at BHE.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-bhe-body md:text-[21px]">
              Tax-deductible gifts fund Art, Music &amp; PE and the programs every Eagle relies on.
              Suggested contribution: ${ask} per child.
            </p>
            <ul className="mt-6 space-y-2 text-[15px] text-bhe-ink">
              {['PTA membership included', 'Tax-deductible', 'Every amount counts'].map((item) => (
                <li className="flex gap-2" key={item}>
                  <span aria-hidden="true" className="text-bhe-green-2">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full max-w-md shrink-0 lg:max-w-[420px]">
            <GiveAmountForm ask={ask} giveBaseUrl={giveUrl} />
          </div>
        </Container>
      </section>

      <GreenBand className="py-14 md:py-[72px]">
        <Container>
          <h2 className="max-w-3xl font-display text-[clamp(32px,4vw,52px)] font-extrabold leading-[1.05] tracking-[-0.03em] text-bhe-on-green">
            Programs, people and resources for every student.
          </h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fundedInitiatives.map((item) => (
              <li
                className="rounded-full border border-bhe-green-line bg-bhe-green-line/30 px-4 py-3 text-sm text-bhe-on-green"
                key={item}
              >
                {item}
              </li>
            ))}
          </ul>
        </Container>
      </GreenBand>

      <section className="py-12 md:py-[72px]">
        <Container className="flex flex-col gap-10 lg:flex-row">
          <div className="flex-1">
            <h2 className="font-display text-[28px] font-extrabold text-bhe-ink md:text-[36px]">
              Other ways to help
            </h2>
            <div className="mt-5 space-y-3">
              {[
                {
                  title: 'Employer matching',
                  href: giveUrl,
                  external: true,
                  body: 'Ask your employer to match your gift and double the impact.',
                },
                {
                  title: 'Local business sponsorship',
                  href: corporateContributionsUrl,
                  external: true,
                  body: 'Sponsor as a business and support campus programs year-round.',
                },
                {
                  title: 'Volunteer your time',
                  href: '/get-involved#volunteer',
                  external: false,
                  body: 'Give an hour or a semester — every bit keeps BHE soaring.',
                },
              ].map((card) =>
                card.external ? (
                  <a
                    className="block rounded-card border border-bhe-border bg-bhe-card p-5 hover:border-bhe-green"
                    href={card.href}
                    key={card.title}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <h3 className="font-display text-lg font-bold text-bhe-ink">{card.title}</h3>
                    <p className="mt-1 text-sm text-bhe-muted">{card.body}</p>
                    <span className="sr-only"> (opens in new tab)</span>
                  </a>
                ) : (
                  <Link
                    className="block rounded-card border border-bhe-border bg-bhe-card p-5 hover:border-bhe-green"
                    key={card.title}
                    to={card.href}
                  >
                    <h3 className="font-display text-lg font-bold text-bhe-ink">{card.title}</h3>
                    <p className="mt-1 text-sm text-bhe-muted">{card.body}</p>
                  </Link>
                ),
              )}
            </div>
          </div>

          <div className="flex-1">
            <h2 className="font-display text-[28px] font-extrabold text-bhe-ink md:text-[36px]">
              Questions
            </h2>
            <div className="mt-5 space-y-3">
              {faqs.map((faq, index) => (
                <details
                  className="rounded-card border border-bhe-border bg-bhe-card px-5 py-4"
                  key={faq.question}
                  open={index === 0}
                >
                  <summary className="cursor-pointer font-display text-lg font-bold text-bhe-ink">
                    {faq.question}
                  </summary>
                  <p className="mt-3 text-[15px] leading-relaxed text-bhe-body">
                    {faq.question === 'Need a reimbursement?' ? (
                      <>
                        Volunteers and staff can submit a reimbursement request for PTA-approved
                        expenses.{' '}
                        <Link className="font-bold text-bhe-green underline" to="/reimbursement">
                          Open the reimbursement form
                        </Link>
                        .
                      </>
                    ) : (
                      faq.answer
                    )}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="pb-16">
        <Container>
          <Button size="lg" to="/get-involved" variant="secondary">
            More ways to get involved
          </Button>
        </Container>
      </section>
    </div>
  );
}
