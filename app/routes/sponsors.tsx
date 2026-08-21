import {Fragment} from 'react';
import {Link, useLoaderData} from 'react-router';

import {corporateContributionsUrl} from '~/data/annual-fund-campaign';
import {pageSeoMeta} from '~/lib/meta';
import {formatSchoolYearLong} from '~/lib/school-year';
import {
  getFeaturedSponsorSchoolYear,
  getSponsorTiers,
  listSponsorSchoolYears,
  resolveSponsorSchoolYear,
  type SponsorTier,
} from '~/lib/sponsors';
import type {Route} from './+types/sponsors';

export function meta({matches}: Route.MetaArgs) {
  return pageSeoMeta(matches, {
    path: '/sponsors',
    title: 'Local Business Sponsors | Barton Hills Elementary PTA',
    description:
      'Become a local business sponsor of Barton Hills Elementary PTA. Your sponsorship supports students, teachers, and programs. Tax-deductible 501(c)(3).',
  });
}

export async function loader({request}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const schoolYear = resolveSponsorSchoolYear(url.searchParams.get('year'));

  return {
    featuredSchoolYear: getFeaturedSponsorSchoolYear(),
    schoolYear,
    schoolYears: listSponsorSchoolYears(),
    tiers: getSponsorTiers(schoolYear),
  };
}

// ─── Data ────────────────────────────────────────────────────────────────────

const fundedItems = [
  'Materials for the library, music, art, & PE',
  'Supplies, development & training for faculty',
  'T-shirts & yearbooks for every student',
  'Cultural Arts programs & performances',
  'Social-emotional learning programs',
  'Physical education and recess equipment',
  'HEPA filters to ensure health & safety',
  'School gardens',
  'Outdoor spaces maintenance & development',
  'Technology inside & outside the classrooms',
  'Academic enrichment fund',
];

// ─── Components ──────────────────────────────────────────────────────────────

function SponsorTierSection({tier}: {tier: SponsorTier}) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-2">
        <div className={`h-10 w-10 rounded-lg ${tier.color} flex items-center justify-center`}>
          <svg
            aria-hidden="true"
            className="h-5 w-5 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-2xl md:text-3xl font-heading font-bold text-charcoal">{tier.name}</h3>
        </div>
      </div>
      <p className="text-sm text-charcoal/70 mb-6 ml-14">{tier.signage}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tier.sponsors.map((sponsor) => (
          <Fragment key={sponsor.name}>
            {sponsor.url ? (
              <a
                aria-label={`Visit ${sponsor.name} website (opens in new tab)`}
                className="transition-transform hover:scale-105"
                href={sponsor.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                <div className="aspect-[3/2] rounded-lg bg-white border border-charcoal/10 flex items-center justify-center p-3">
                  <img
                    alt={sponsor.name}
                    className={`max-h-full max-w-full object-contain ${sponsor.logoClassName ?? ''}`}
                    src={sponsor.logo}
                  />
                </div>
              </a>
            ) : (
              <div className="aspect-[3/2] rounded-lg bg-white border border-charcoal/10 flex items-center justify-center p-3">
                <img
                  alt={sponsor.name}
                  className={`max-h-full max-w-full object-contain ${sponsor.logoClassName ?? ''}`}
                  src={sponsor.logo}
                />
              </div>
            )}
          </Fragment>
        ))}
        {Array.from({
          length: Math.min(1, Math.max(0, tier.slots - tier.sponsors.length)),
        }).map(() => (
          <a
            aria-label="Become a sponsor (opens in new tab)"
            className={`aspect-[3/2] rounded-lg ${tier.bgLight} border-2 border-dashed ${tier.borderColor} flex items-center justify-center transition-colors hover:border-spirit-gold/50 hover:scale-105`}
            href={corporateContributionsUrl}
            key={`${tier.name}-empty-placeholder`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="text-xs font-medium text-charcoal/30 text-center px-3">
              Your Logo Here
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Sponsors() {
  const {featuredSchoolYear, schoolYear, schoolYears, tiers} = useLoaderData<typeof loader>();
  const showYearPicker = schoolYears.length > 1;

  return (
    <div>
      {/* ── 1. Page Banner ───────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-eagle-blue to-night-blue py-16 md:py-24 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, transparent, transparent 60px, #d4a843 60px, #d4a843 62px)',
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white">
            Local Business Sponsors
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            BHE Local Business Contributions {formatSchoolYearLong(schoolYear)}
          </p>
          <div className="mt-6 h-1 w-20 bg-spirit-gold rounded-full mx-auto" />
        </div>
      </section>

      {/* ── 2. Intro ─────────────────────────────────────────────────────── */}
      <section className="bg-warm-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal">
            Support Our Students & Teachers
          </h2>
          <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full mx-auto" />
          <p className="mt-8 text-lg md:text-xl text-charcoal/70 leading-relaxed">
            Becoming a BHE Sponsor is an opportunity for your business to gain exposure within the
            Barton Hills community while supporting a good cause. Every business that contributes
            will have their company logo or name printed on signage and displayed on the school
            fence along Barton Hills Drive for one year.
          </p>
          <div className="mt-8">
            <a
              className="inline-flex items-center bg-spirit-gold text-night-blue font-heading font-bold text-lg px-8 py-3.5 rounded-full border-2 border-spirit-gold hover:bg-white transition-colors duration-200"
              href={corporateContributionsUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Contribute Now
              <span className="sr-only">(opens in new tab)</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── 3. What Your Contribution Funds ─────────────────────────────── */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal">
              Where the Funds Go
            </h2>
            <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fundedItems.map((item) => (
              <div className="flex items-start gap-3 p-3" key={item}>
                <svg
                  aria-hidden="true"
                  className="h-5 w-5 text-creek-green shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M4.5 12.75l6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-charcoal/70">{item}</span>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-charcoal/70">
            Barton Hills Elementary PTA is a 501(c)(3) non-profit organization. Tax ID: #74-6086853.
            Your contribution is tax-deductible.
          </p>
        </div>
      </section>

      {/* ── 4. Sponsor Tiers ─────────────────────────────────────────────── */}
      <section className="bg-warm-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal">
              Sponsorship Levels
            </h2>
            <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full mx-auto" />
            <p className="mt-6 text-charcoal/70">
              Every sponsor receives a sign displayed on the school fence along Barton Hills Drive
              for one year.
            </p>
            {showYearPicker && (
              <div
                aria-label="School year"
                className="mt-8 inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-white p-1.5 shadow-sm border border-charcoal/10"
                role="tablist"
              >
                {schoolYears.map((year) => {
                  const isSelected = year === schoolYear;
                  const yearHref = year === featuredSchoolYear ? '/sponsors' : `/sponsors?year=${year}`;
                  return (
                    <Link
                      aria-current={isSelected ? 'page' : undefined}
                      className={`rounded-full px-4 py-2 text-sm font-heading font-semibold transition-colors ${
                        isSelected
                          ? 'bg-eagle-blue text-white'
                          : 'text-charcoal/70 hover:text-charcoal hover:bg-charcoal/5'
                      }`}
                      key={year}
                      to={yearHref}
                    >
                      {year}
                      {year === featuredSchoolYear ? ' (current)' : ''}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-16">
            {tiers.map((tier) => (
              <SponsorTierSection key={tier.name} tier={tier} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Become a Sponsor CTA ──────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-eagle-blue to-night-blue py-16 md:py-24 overflow-hidden">
        <div
          className="absolute top-0 right-0 w-1/2 h-full bg-spirit-gold/5"
          style={{clipPath: 'polygon(100% 0, 0 100%, 100% 100%)'}}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">
            Become a Sponsor
          </h2>
          <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full mx-auto" />
          <p className="mt-6 text-lg text-white/90 leading-relaxed">
            Support our school community and gain visibility with Barton Hills families. Your
            sponsorship directly funds programs that benefit every student.
          </p>
          <div className="mt-8">
            <a
              className="inline-flex items-center bg-spirit-gold text-night-blue font-heading font-bold text-lg px-8 py-3.5 rounded-full border-2 border-spirit-gold hover:bg-white transition-colors duration-200"
              href={corporateContributionsUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Contribute Now
              <span className="sr-only">(opens in new tab)</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
