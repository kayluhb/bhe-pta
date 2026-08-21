import {Link} from 'react-router';
import {EventCard} from '~/components/EventCard';
import {FundraisingProgress} from '~/components/fundraising/FundraisingProgress';
import {NewsCard} from '~/components/NewsCard';
import {NewsletterSignup} from '~/components/NewsletterSignup';
import {annualFundCampaign} from '~/data/annual-fund-campaign';
import {mergeParentMeta} from '~/lib/meta';
import {mockNewsletters, mockPtaNewsletters} from '~/lib/mock-data';
import {getFeaturedSponsorSchoolYear, getRandomSponsors} from '~/lib/sponsors';
import {formatSchoolYearLong} from '~/lib/school-year';
import type {CalendarEvent} from '~/lib/types';
import type {Route} from './+types/home';

export function meta({matches}: Route.MetaArgs) {
  return mergeParentMeta(matches, [
    {title: 'Barton Hills Elementary PTA | Soaring Together Since 1964'},
    {
      name: 'description',
      content:
        'Barton Hills Elementary PTA - Supporting our school community through parent involvement, fundraising, and advocacy.',
    },
  ]);
}

// ─── Loader ──────────────────────────────────────────────────────────────────

export async function loader({context}: Route.LoaderArgs) {
  let events: CalendarEvent[] = [];
  let schoolNews = mockNewsletters;
  let ptaNews = mockPtaNewsletters;

  try {
    const kvEvents = await context.cloudflare.env.BHE_CALENDAR.get('events', 'json');
    if (kvEvents) events = kvEvents as typeof events;
    const kvSchool = await context.cloudflare.env.BHE_NEWSLETTERS.get('latest', 'json');
    if (kvSchool) schoolNews = kvSchool as typeof schoolNews;
    const kvPta = await context.cloudflare.env.BHE_PTA_NEWSLETTERS.get('latest', 'json');
    if (kvPta) ptaNews = kvPta as typeof ptaNews;
  } catch {
    // KV not available — use mock data
  }

  const allNews = [...schoolNews, ...ptaNews]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingEvents = events
    .filter((e) => new Date(e.start) >= today)
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 6);

  const sponsorSchoolYear = getFeaturedSponsorSchoolYear();
  const sponsors = getRandomSponsors(6, sponsorSchoolYear);

  return {annualFundCampaign, events: upcomingEvents, news: allNews, sponsorSchoolYear, sponsors};
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatEventMonth(dateStr: string): string {
  const date = dateStr.includes('T') ? new Date(dateStr) : new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('en-US', {month: 'short'});
}

function formatEventDay(dateStr: string): string {
  const date = dateStr.includes('T') ? new Date(dateStr) : new Date(`${dateStr}T00:00:00`);
  return date.getDate().toString();
}

function formatNewsDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const programs = [
  {
    name: 'Cultural Arts',
    description: 'Bringing live performances and art workshops to students',
    color: 'bg-eagle-blue',
    icon: (
      <svg
        aria-hidden="true"
        className="h-8 w-8"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <path
          d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: 'Reflections',
    description: 'National arts recognition program for student creativity',
    color: 'bg-spirit-gold',
    icon: (
      <svg
        aria-hidden="true"
        className="h-8 w-8"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <path
          d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: 'Greenworks',
    description: 'Environmental education and school garden stewardship',
    color: 'bg-creek-green',
    icon: (
      <svg
        aria-hidden="true"
        className="h-8 w-8"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <path
          d="M12 21V10m0 0c0-4.418 3.582-8 8-8 0 4.418-3.582 8-8 8zm0 0c0-3.314-2.686-6-6-6 0 3.314 2.686 6 6 6z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: 'Nick Akery Scholarship',
    description: 'Supporting college-bound BHE alumni with financial aid',
    color: 'bg-eagle-blue',
    icon: (
      <svg
        aria-hidden="true"
        className="h-8 w-8"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <path
          d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: 'Social-Emotional Learning',
    description: 'Building resilience, empathy, and confidence in every student',
    color: 'bg-creek-green',
    icon: (
      <svg
        aria-hidden="true"
        className="h-8 w-8"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <path
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

// ─── Section Header Helper ──────────────────────────────────────────────────

function SectionHeader({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-10 ${className}`}>
      <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal">{children}</h2>
      <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full" />
    </div>
  );
}

// ─── Homepage Component ─────────────────────────────────────────────────────

export default function Home({loaderData}: Route.ComponentProps) {
  const {annualFundCampaign: campaign, events, news, sponsorSchoolYear, sponsors} = loaderData;
  return (
    <div>
      {/* ── 1. Hero Section ─────────────────────────────────────────────── */}
      <section className="relative min-h-[40vh] flex items-center bg-gradient-to-br from-eagle-blue to-night-blue overflow-hidden">
        {/* Diagonal gold accent stripe */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, transparent, transparent 60px, #d4a843 60px, #d4a843 62px)',
          }}
        />

        {/* Gold diagonal accent bar */}
        <div
          aria-hidden="true"
          className="absolute -right-20 top-1/4 w-80 h-2 bg-spirit-gold/30 rotate-[135deg]"
        />
        <div
          aria-hidden="true"
          className="absolute -left-10 bottom-1/3 w-60 h-1.5 bg-spirit-gold/20 rotate-[135deg]"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 md:py-16 lg:py-20 w-full">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white leading-tight max-w-3xl">
            Soaring Together <span className="block text-spirit-gold">Since 1964</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed">
            Supporting our school community through parent involvement, fundraising, and advocacy
          </p>
          <div className="mt-6">
            <Link
              className="inline-flex items-center bg-spirit-gold text-night-blue font-heading font-bold text-base px-6 py-3 rounded-full hover:bg-spirit-gold/90 transition-all duration-200 hover:shadow-lg hover:shadow-spirit-gold/25"
              to="/get-involved"
            >
              Join PTA
            </Link>
          </div>
        </div>

        {/* Angled bottom edge */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-16 bg-warm-white"
          style={{clipPath: 'polygon(0 100%, 100% 0, 100% 100%)'}}
        />
      </section>

      <section className="bg-white py-16 md:py-20 border-y border-charcoal/5">
        <div className="max-w-7xl mx-auto px-4">
          <FundraisingProgress campaign={campaign} className="mt-0" />
          <div className="mt-10">
            <a
              className="inline-flex items-center bg-spirit-gold text-night-blue font-heading font-bold text-lg px-8 py-3.5 rounded-full hover:bg-spirit-gold/90 transition-all duration-200 hover:shadow-lg hover:shadow-spirit-gold/25"
              href={campaign.giveUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Become a Member
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── 2. Upcoming Events Section ──────────────────────────────────── */}
      <section className="bg-warm-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader>Upcoming Events</SectionHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {events.map((event) => (
              <div className="min-h-0 h-full" key={event.id}>
                <EventCard
                  day={formatEventDay(event.start)}
                  description={event.description || event.category}
                  month={formatEventMonth(event.start)}
                  title={event.title}
                />
              </div>
            ))}
          </div>

          <div className="mt-10 text-right">
            <Link
              className="inline-flex items-center gap-1 font-heading font-bold text-eagle-blue hover:text-spirit-gold transition-colors"
              to="/events"
            >
              View All Events
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Angled divider ──────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="h-16 bg-warm-white -mb-1"
        style={{clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 0)'}}
      />

      {/* ── 3. Latest News Section ──────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader>Latest News</SectionHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {news.map((item) => (
              <NewsCard
                date={formatNewsDate(item.date)}
                excerpt={item.excerpt}
                key={item.id}
                title={item.title}
                to={item.url !== '#' ? item.url : '/news'}
              />
            ))}
          </div>

          <div className="mt-10 text-right">
            <Link
              className="inline-flex items-center gap-1 font-heading font-bold text-eagle-blue hover:text-spirit-gold transition-colors"
              to="/news"
            >
              All News
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Newsletter Signup ───────────────────────────────────────────── */}
      <NewsletterSignup />

      {/* ── Angled divider ──────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="h-16 bg-white"
        style={{clipPath: 'polygon(0 0, 100% 0, 0 100%, 0 0)'}}
      />

      {/* ── 4. Get Involved Section ─────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-eagle-blue to-night-blue py-16 md:py-24 overflow-hidden">
        {/* Subtle gold diagonal accent */}
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 w-1/2 h-full bg-spirit-gold/5"
          style={{clipPath: 'polygon(100% 0, 0 100%, 100% 100%)'}}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="mb-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">Get Involved</h2>
            <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Volunteer Card */}
            <div className="group bg-white rounded-lg shadow-lg border-b-4 border-spirit-gold p-8 transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
              <div className="h-14 w-14 rounded-full bg-eagle-blue/10 flex items-center justify-center mb-5">
                <svg
                  aria-hidden="true"
                  className="h-7 w-7 text-eagle-blue"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="font-heading font-bold text-xl text-charcoal">Volunteer</h3>
              <p className="mt-3 text-charcoal/70 leading-relaxed">
                We cannot do what we do without your help! There are many ways to get involved and
                make a difference.
              </p>
              <Link
                className="mt-5 inline-flex items-center gap-1 font-heading font-bold text-sm text-eagle-blue hover:text-spirit-gold transition-colors"
                to="/get-involved"
              >
                Learn More
                <span className="sr-only"> about volunteering</span>
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>

            {/* Join PTA Card */}
            <div className="group bg-white rounded-lg shadow-lg border-b-4 border-spirit-gold p-8 transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
              <div className="h-14 w-14 rounded-full bg-eagle-blue/10 flex items-center justify-center mb-5">
                <svg
                  aria-hidden="true"
                  className="h-7 w-7 text-eagle-blue"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="font-heading font-bold text-xl text-charcoal">Join PTA</h3>
              <p className="mt-3 text-charcoal/70 leading-relaxed">
                Membership helps support students, teachers, staff, and programs that make Barton
                Hills great.
              </p>
              <a
                className="mt-5 inline-flex items-center gap-1 font-heading font-bold text-sm text-eagle-blue hover:text-spirit-gold transition-colors"
                href={campaign.giveUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                Join Now
                <span className="sr-only">(opens in new tab)</span>
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>

            {/* Annual Fund Card */}
            <div className="group bg-white rounded-lg shadow-lg border-b-4 border-spirit-gold p-8 transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
              <div className="h-14 w-14 rounded-full bg-eagle-blue/10 flex items-center justify-center mb-5">
                <svg
                  aria-hidden="true"
                  className="h-7 w-7 text-eagle-blue"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="font-heading font-bold text-xl text-charcoal">Annual Fund</h3>
              <p className="mt-3 text-charcoal/70 leading-relaxed">
                Over <span className="font-bold text-charcoal">$600 per student</span> annually goes
                directly to programs, staff, and resources.
              </p>
              <a
                className="mt-5 inline-flex items-center gap-1 font-heading font-bold text-sm text-eagle-blue hover:text-spirit-gold transition-colors"
                href={campaign.giveUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                Give Now
                <span className="sr-only">(opens in new tab)</span>
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Angled divider ──────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="h-16 bg-gradient-to-br from-eagle-blue to-night-blue -mb-1"
        style={{clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 0)'}}
      />

      {/* ── 5. Programs Highlight Section ───────────────────────────────── */}
      <section className="bg-warm-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader>Our Programs</SectionHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {programs.map((program) => (
              <div
                className="group flex items-start gap-4 bg-white rounded-lg shadow-md p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                key={program.name}
              >
                <div
                  className={`shrink-0 h-12 w-12 rounded-lg ${program.color} flex items-center justify-center text-white`}
                >
                  {program.icon}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-charcoal group-hover:text-eagle-blue transition-colors">
                    {program.name}
                  </h3>
                  <p className="mt-1 text-sm text-charcoal/70 leading-relaxed">
                    {program.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-right">
            <Link
              className="inline-flex items-center gap-1 font-heading font-bold text-eagle-blue hover:text-spirit-gold transition-colors"
              to="/programs"
            >
              View All Programs
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. Sponsors/Partners Section ────────────────────────────────── */}
      <section className="bg-white border-t border-charcoal/5 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal">
            Our Partners
          </h2>
          <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full mx-auto" />

          <p className="mt-6 text-charcoal/70 max-w-2xl mx-auto text-lg leading-relaxed">
            Thank you to our generous local business sponsors who make our programs possible
            {sponsorSchoolYear ? ` (${formatSchoolYearLong(sponsorSchoolYear)})` : ''}
          </p>

          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {sponsors.map((sponsor) => (
              <div
                className="aspect-[3/2] rounded-lg bg-white border border-charcoal/10 flex items-center justify-center p-3"
                key={sponsor.name}
              >
                <img
                  alt={sponsor.name}
                  className={`max-h-full max-w-full object-contain ${sponsor.logoClassName ?? ''}`}
                  src={sponsor.logo}
                />
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link
              className="inline-flex items-center gap-1 font-heading font-bold text-eagle-blue hover:text-spirit-gold transition-colors"
              to="/sponsors"
            >
              Become a Local Business Sponsor
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
