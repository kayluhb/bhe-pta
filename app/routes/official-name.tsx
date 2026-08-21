import {Link} from 'react-router';

import {mergeParentMeta} from '~/lib/meta';
import type {Route} from './+types/official-name';

const OFFICIAL_NAME = 'PTA Texas Congress Barton Hills Elementary';
const COMMON_NAME = 'Barton Hills Elementary PTA';
const ACRONYM = 'BHE';
const ACRONYM_EXPANSION = 'Barton Hills Elementary';
const WEBSITE = 'bheeagles.com';
const TAX_ID = '74-6086853';

const MISSION_STATEMENT =
  'The Barton Hills Elementary PTA (BHE PTA) partners with families, teachers, and staff to strengthen our school community and enrich every student’s education. We raise and steward funds, coordinate volunteers, and deliver programs that support classroom learning, celebrate the arts, build community, and care for our teachers and campus.';

const PROGRAMS_AND_SERVICES = [
  'Annual Fund and community fundraising for school programs and staffing',
  'Teacher grants, classroom reimbursements, and supplies for students and staff',
  'Cultural Arts performances and the PTA Reflections arts recognition program',
  'Community events, spirit nights, and family engagement opportunities',
  'Teacher hospitality, appreciation, and end-of-semester recognition',
  'Greenworks garden and environmental stewardship programs',
  'Nick Akery Scholarship for Barton Hills Elementary alumni',
  'Parent education and support series for families',
];

export function meta({matches}: Route.MetaArgs) {
  return mergeParentMeta(matches, [
    {title: `Official Name & Organization | ${COMMON_NAME}`},
    {
      name: 'description',
      content: `${MISSION_STATEMENT} Registered as ${OFFICIAL_NAME}.`,
    },
  ]);
}

export default function OfficialName() {
  return (
    <div>
      <section className="relative bg-linear-to-br from-eagle-blue to-night-blue py-16 md:py-24 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, transparent, transparent 60px, #d4a843 60px, #d4a843 62px)',
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white">
            Organization Information
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Official name, mission, and transparency details for {COMMON_NAME}
          </p>
          <div className="mt-6 h-1 w-20 bg-spirit-gold rounded-full mx-auto" />
        </div>
      </section>

      <section className="bg-warm-white py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-sm font-heading font-semibold uppercase tracking-wider text-charcoal/60">
            Registered Official Name
          </p>
          <p className="mt-4 text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-charcoal leading-tight">
            {OFFICIAL_NAME}
          </p>
          <div className="mt-8 h-1 w-16 bg-spirit-gold rounded-full mx-auto" />
          <p className="mt-8 text-lg text-charcoal/70 leading-relaxed">
            This is the legal name used on official PTA forms, tax filings, and correspondence. Our
            community commonly refers to the organization as <strong>{COMMON_NAME}</strong> or{' '}
            <strong>{ACRONYM} PTA</strong>.
          </p>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24 border-y border-charcoal/5">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal text-center">
            Name &amp; Domain
          </h2>
          <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full mx-auto" />
          <p className="mt-8 text-lg text-charcoal/70 leading-relaxed">
            The acronym <strong>{ACRONYM}</strong> stands for{' '}
            <strong>{ACRONYM_EXPANSION}</strong>. Our official website is{' '}
            <a
              className="font-medium text-eagle-blue hover:text-spirit-gold transition-colors"
              href={`https://${WEBSITE}`}
            >
              {WEBSITE}
            </a>
            , where <strong>{ACRONYM.toLowerCase()}</strong> in the domain matches{' '}
            <strong>{ACRONYM_EXPANSION}</strong> and <strong>eagles</strong> is our school mascot.
            The organization name, acronym, and domain all refer to the same parent teacher
            association serving Barton Hills Elementary in Austin, Texas.
          </p>
        </div>
      </section>

      <section className="bg-warm-white py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal text-center">
            Our Mission
          </h2>
          <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full mx-auto" />
          <p className="mt-8 text-lg md:text-xl text-charcoal/70 leading-relaxed text-center">
            {MISSION_STATEMENT}
          </p>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24 border-y border-charcoal/5">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal text-center">
            Programs &amp; Services
          </h2>
          <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full mx-auto" />
          <p className="mt-8 text-lg text-charcoal/70 leading-relaxed text-center">
            Through volunteer leadership and family participation, {COMMON_NAME} provides:
          </p>
          <ul className="mt-8 space-y-3">
            {PROGRAMS_AND_SERVICES.map((program) => (
              <li className="flex items-start gap-3" key={program}>
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
                <span className="text-charcoal/70">{program}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center">
            <Link
              className="font-heading font-bold text-eagle-blue hover:text-spirit-gold transition-colors"
              to="/programs"
            >
              View all programs
            </Link>
          </p>
        </div>
      </section>

      <section className="bg-warm-white py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal text-center">
            Organization Details
          </h2>
          <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full mx-auto" />
          <dl className="mt-10 divide-y divide-charcoal/10 rounded-xl border border-charcoal/10 bg-white">
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="font-heading font-bold text-charcoal">Official name</dt>
              <dd className="mt-1 text-charcoal/70 sm:col-span-2 sm:mt-0">{OFFICIAL_NAME}</dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="font-heading font-bold text-charcoal">Common name</dt>
              <dd className="mt-1 text-charcoal/70 sm:col-span-2 sm:mt-0">{COMMON_NAME}</dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="font-heading font-bold text-charcoal">Acronym</dt>
              <dd className="mt-1 text-charcoal/70 sm:col-span-2 sm:mt-0">
                {ACRONYM} ({ACRONYM_EXPANSION})
              </dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="font-heading font-bold text-charcoal">Website</dt>
              <dd className="mt-1 text-charcoal/70 sm:col-span-2 sm:mt-0">
                <a
                  className="text-eagle-blue hover:text-spirit-gold transition-colors"
                  href={`https://${WEBSITE}`}
                >
                  https://{WEBSITE}
                </a>
              </dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="font-heading font-bold text-charcoal">Tax status</dt>
              <dd className="mt-1 text-charcoal/70 sm:col-span-2 sm:mt-0">
                501(c)(3) nonprofit organization
              </dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="font-heading font-bold text-charcoal">Tax ID (EIN)</dt>
              <dd className="mt-1 text-charcoal/70 sm:col-span-2 sm:mt-0">{TAX_ID}</dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="font-heading font-bold text-charcoal">Mailing address</dt>
              <dd className="mt-1 text-charcoal/70 sm:col-span-2 sm:mt-0">
                2108 Barton Hills Drive
                <br />
                Austin, TX 78704
              </dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="font-heading font-bold text-charcoal">Contact</dt>
              <dd className="mt-1 text-charcoal/70 sm:col-span-2 sm:mt-0">
                <a
                  className="text-eagle-blue hover:text-spirit-gold transition-colors"
                  href="mailto:pta@bheeagles.com"
                >
                  pta@bheeagles.com
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
