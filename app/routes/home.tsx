import {Link} from 'react-router';

import {NewsletterSignup} from '~/components/NewsletterSignup';
import {Button} from '~/components/ui/Button';
import {Container} from '~/components/ui/Container';
import {DateTile} from '~/components/ui/DateTile';
import {GreenBand} from '~/components/ui/GreenBand';
import {annualFundCampaign, annualFundPath} from '~/data/annual-fund-campaign';
import {descriptionHasHtml, sanitizeCalendarEvents} from '~/lib/calendar';
import {getCloudflare} from '~/lib/cloudflare-context';
import {formatNewsletterDate} from '~/lib/format-newsletter-date';
import {loadPublishedCampaign} from '~/lib/fundraising/campaign-store';
import {pickHomeBannerEvent, pickHomeUpcomingEvents} from '~/lib/home-upcoming-events';
import {pageSeoMeta} from '~/lib/meta';
import {mixNewsletters} from '~/lib/mix-newsletters';
import {mockEvents, mockNewsletters, mockPtaNewsletters} from '~/lib/mock-data';
import {formatSchoolYearLong} from '~/lib/school-year';
import {getFeaturedSponsorSchoolYear, getFeaturedSponsors} from '~/lib/sponsors';
import type {CalendarEvent} from '~/lib/types';
import type {Route} from './+types/home';

export function meta({loaderData, matches}: Route.MetaArgs) {
  const ask =
    loaderData?.annualFundCampaign.suggestedAskPerChild ?? annualFundCampaign.suggestedAskPerChild;
  return pageSeoMeta(matches, {
    path: '/',
    title: 'Barton Hills Elementary PTA | Soaring Together Since 1964',
    description: `Donate to the Barton Hills Elementary PTA Annual Fund and support Art, Music & PE, classroom programs, and our Austin school community. Suggested $${ask} per child.`,
    ogTitle: 'Barton Hills Elementary PTA | Give to the Annual Fund',
    ogDescription:
      'Support Art, Music & PE and every Eagle. Tax-deductible gifts to Barton Hills Elementary PTA.',
  });
}

export async function loader({context}: Route.LoaderArgs) {
  let events: CalendarEvent[] = mockEvents;
  let schoolNews = mockNewsletters;
  let ptaNews = mockPtaNewsletters;
  let campaign = annualFundCampaign;

  try {
    const env = getCloudflare(context).env;
    try {
      campaign = await loadPublishedCampaign(env.REIMBURSEMENT_DB);
    } catch {
      campaign = annualFundCampaign;
    }
    const kvEvents = await env.BHE_CALENDAR.get('events', 'json');
    if (kvEvents) {
      const sanitized = sanitizeCalendarEvents(kvEvents as typeof events);
      if (sanitized.length > 0) events = sanitized;
    }
    const kvSchool = await env.BHE_NEWSLETTERS.get('latest', 'json');
    if (kvSchool) schoolNews = kvSchool as typeof schoolNews;
    const kvPta = await env.BHE_PTA_NEWSLETTERS.get('latest', 'json');
    if (kvPta) ptaNews = kvPta as typeof ptaNews;
  } catch {
    // KV not available — use mock data
  }

  const now = new Date();
  const allNews = mixNewsletters(schoolNews, ptaNews, 3);
  const upcomingEvents = pickHomeUpcomingEvents(events, now, 3);
  const bannerEvent = pickHomeBannerEvent(events, now);

  const sponsorSchoolYear = getFeaturedSponsorSchoolYear();
  const sponsors = getFeaturedSponsors(6, sponsorSchoolYear);

  return {
    annualFundCampaign: campaign,
    bannerEvent: bannerEvent ?? null,
    events: upcomingEvents,
    news: allNews,
    sponsorSchoolYear,
    sponsors,
  };
}

function formatEventMonth(dateStr: string): string {
  const date = dateStr.includes('T') ? new Date(dateStr) : new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('en-US', {month: 'short'}).toUpperCase();
}

function formatEventDay(dateStr: string): string {
  const date = dateStr.includes('T') ? new Date(dateStr) : new Date(`${dateStr}T00:00:00`);
  return date.getDate().toString();
}

function formatEventWeekday(dateStr: string): string {
  const date = dateStr.includes('T') ? new Date(dateStr) : new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('en-US', {weekday: 'long'});
}

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

const programs = [
  {
    name: 'Art, Music & PE',
    description: 'The PTA funds the final third of these special-area teaching roles every year',
  },
  {
    name: 'Academic Enrichment',
    description: 'After-school activities, Reflections, and field trips beyond the core day',
  },
  {
    name: 'Teacher Grants',
    description: 'Classroom projects and materials teachers request for their students',
  },
  {
    name: 'Cultural Arts',
    description: 'Live performances and artist visits that bring the wider world to campus',
  },
  {
    name: 'Greenworks',
    description: 'Gardens, outdoor campus care, and hands-on environmental learning',
  },
];

const flockCards = [
  {
    title: 'Volunteer',
    description: 'Give an hour or a semester — 25+ ways to help keep BHE soaring.',
    to: '/get-involved#volunteer',
    linkLabel: 'Find a role →',
  },
  {
    title: 'Join the PTA',
    description: 'Membership is included with your Annual Fund gift. Belong to the flock.',
    to: '/get-involved#join',
    linkLabel: 'Become a member →',
  },
  {
    title: 'Sponsor as a business',
    description: 'Local businesses power programs and events that serve every student.',
    to: '/sponsors',
    linkLabel: 'View sponsor tiers →',
  },
];

export default function Home({loaderData}: Route.ComponentProps) {
  const {annualFundCampaign: campaign, events, news, sponsorSchoolYear, sponsors} = loaderData;
  const ask = campaign.suggestedAskPerChild;

  return (
    <div>
      {/* Hero */}
      <section className="pt-8 md:pt-[72px]">
        <Container className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
          <div className="flex flex-col gap-5 md:gap-6">
            <p className="inline-flex self-start rounded-full border-[1.5px] border-bhe-green px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-bhe-ink md:text-sm">
              Go Eagles · Est. 1964
            </p>
            <h1 className="font-display text-[46px] font-extrabold leading-[0.98] tracking-[-0.035em] text-bhe-ink md:text-[clamp(48px,6vw,84px)]">
              Soaring together since 1964.
            </h1>
            <p className="max-w-[34ch] text-lg leading-relaxed text-bhe-body md:text-[21px]">
              Parents, teachers and neighbors keeping Barton Hills a school where every Eagle
              thrives — through volunteering, fundraising and advocacy.
            </p>
            <div className="mt-1 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <Button size="lg" to={annualFundPath} variant="primary">
                Give to the Annual Fund
              </Button>
              <Button size="lg" to="/get-involved" variant="secondary">
                Get involved
              </Button>
            </div>
          </div>

          <div className="mb-4 md:mb-0">
            <div className="h-[260px] overflow-hidden rounded-[22px] md:h-[460px] md:rounded-panel">
              <img
                alt="Front entrance of Barton Hills Elementary"
                className="h-full w-full object-cover object-[center_40%]"
                src="/school-front.jpg"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Coming up */}
      <section className="py-12 md:py-[72px]">
        <Container>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-[30px] font-extrabold tracking-[-0.02em] text-bhe-ink md:text-[44px]">
              Coming up
            </h2>
            <Button to="/events" variant="text-link">
              View all events →
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {events.map((event) => (
              <article
                className="flex gap-4 rounded-card border border-bhe-border bg-bhe-card p-5"
                key={event.id}
              >
                <DateTile day={formatEventDay(event.start)} label={formatEventMonth(event.start)} />
                <div className="min-w-0">
                  <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-bhe-green-2">
                    {formatEventWeekday(event.start)}
                    {event.category ? ` · ${event.category}` : ''}
                  </p>
                  <h3 className="mt-1 font-display text-xl font-bold text-bhe-ink">
                    {event.title}
                  </h3>
                  {event.description ? (
                    descriptionHasHtml(event.description) ? (
                      <div
                        className="mt-1 text-sm leading-relaxed text-bhe-muted [&_a]:font-bold [&_a]:text-bhe-green [&_a]:underline"
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized in calendar.ts
                        dangerouslySetInnerHTML={{__html: event.description}}
                      />
                    ) : (
                      <p className="mt-1 text-sm leading-relaxed text-bhe-muted">
                        {event.description}
                      </p>
                    )
                  ) : null}
                </div>
              </article>
            ))}
            {events.length === 0 ? (
              <p className="text-bhe-muted md:col-span-3">More events will be posted soon.</p>
            ) : null}
          </div>
        </Container>
      </section>

      {/* From the nest */}
      <section className="bg-bhe-paper-2/50 py-12 md:py-[72px]">
        <Container>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-[30px] font-extrabold tracking-[-0.02em] text-bhe-ink md:text-[44px]">
              From the nest
            </h2>
            <Button to="/news" variant="text-link">
              All news →
            </Button>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {news.map((item) => {
              const href = item.url !== '#' ? item.url : '/news';
              const title = (
                <h3 className="mt-3 font-display text-[22px] font-bold leading-snug text-bhe-ink md:text-[25px]">
                  {item.title}
                </h3>
              );
              return (
                <article
                  className="overflow-hidden rounded-card border border-bhe-border bg-bhe-card"
                  key={item.id}
                >
                  {item.imageUrl ? (
                    <div className="aspect-[4/3] overflow-hidden bg-bhe-tint-green">
                      <img
                        alt=""
                        className="h-full w-full object-cover object-top"
                        loading="lazy"
                        src={item.imageUrl}
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-bhe-tint-green" />
                  )}
                  <div className="p-5">
                    <p className="text-sm text-bhe-muted">
                      {formatNewsletterDate(item.date)} ·{' '}
                      {item.source === 'pta' ? 'PTA newsletter' : 'Newsletter'}
                    </p>
                    {isExternalUrl(href) ? (
                      <a
                        className="block hover:text-bhe-green-2"
                        href={href}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {title}
                        <span className="sr-only"> (opens in new tab)</span>
                      </a>
                    ) : (
                      <Link className="block hover:text-bhe-green-2" to={href}>
                        {title}
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Annual Fund band */}
      <GreenBand className="py-14 md:py-[88px]">
        <Container className="flex flex-col gap-10 lg:flex-row lg:items-center">
          <div className="flex-1">
            <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-bhe-gold">
              The Annual Fund
            </p>
            <h2 className="mt-3 font-display text-[clamp(32px,4.4vw,60px)] font-extrabold leading-[1.02] tracking-[-0.03em] text-bhe-on-green">
              One gift. A whole year of Eagle programs.
            </h2>
            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-bhe-on-green-muted">
              Your contribution funds Art, Music & PE, enrichment, and the everyday resources AISD
              does not fully cover — for every student at Barton Hills.
            </p>
          </div>
          <div className="w-full max-w-md rounded-panel bg-bhe-paper p-7 text-bhe-ink shadow-form md:p-9">
            <p className="font-display text-[52px] font-extrabold leading-none md:text-[64px]">
              ${ask}
            </p>
            <p className="mt-1 text-bhe-muted">suggested per child</p>
            <ul className="mt-5 space-y-2 text-[15px]">
              {[
                'Includes your PTA membership',
                'Tax-deductible',
                'Any amount makes a difference',
              ].map((item) => (
                <li className="flex gap-2" key={item}>
                  <span aria-hidden="true" className="text-bhe-green-2">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button className="mt-6 w-full" size="lg" to={annualFundPath} variant="accent">
              Give now
            </Button>
            <Link
              className="mt-4 inline-flex text-sm font-bold text-bhe-green hover:underline"
              to="/reimbursement"
            >
              Need a reimbursement form?
            </Link>
          </div>
        </Container>
      </GreenBand>

      {/* Find your flock */}
      <section className="py-12 md:py-[72px]">
        <Container>
          <h2 className="font-display text-[30px] font-extrabold tracking-[-0.02em] text-bhe-ink md:text-[44px]">
            Find your flock
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {flockCards.map((card) => (
              <article
                className="rounded-card border border-bhe-border bg-bhe-card p-6"
                key={card.title}
              >
                <h3 className="font-display text-xl font-bold text-bhe-ink">{card.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-bhe-muted">
                  {card.description}
                </p>
                <Link
                  className="mt-4 inline-flex font-bold text-bhe-green hover:underline"
                  to={card.to}
                >
                  {card.linkLabel}
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* What your gift funds */}
      <section className="py-12 md:py-[72px]">
        <Container>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-[30px] font-extrabold tracking-[-0.02em] text-bhe-ink md:text-[44px]">
              What your gift funds
            </h2>
            <Button to="/programs" variant="text-link">
              View all programs →
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => (
              <div className="border-t-[3px] border-bhe-green pt-4" key={program.name}>
                <h3 className="font-display text-xl font-bold text-bhe-ink">{program.name}</h3>
                <p className="mt-2 text-[15px] text-bhe-muted">{program.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <NewsletterSignup />

      {/* Sponsors */}
      <section className="py-12 md:py-[72px]">
        <Container>
          <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-bhe-green-2">
            {formatSchoolYearLong(sponsorSchoolYear)} local business sponsors
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-[30px] font-extrabold tracking-[-0.02em] text-bhe-ink md:text-[44px]">
              Thank you, neighbors.
            </h2>
            <div className="flex flex-wrap gap-4">
              <Link className="font-bold text-bhe-green hover:underline" to="/sponsors">
                View all sponsors
              </Link>
              <Link className="font-bold text-bhe-green hover:underline" to="/sponsors">
                Become a sponsor →
              </Link>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {sponsors.map((sponsor) => (
              <div
                className="flex h-24 items-center justify-center rounded-card border border-bhe-border bg-bhe-card p-4"
                key={sponsor.name}
              >
                {sponsor.url ? (
                  <a
                    className="flex h-full w-full items-center justify-center"
                    href={sponsor.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <img
                      alt={sponsor.name}
                      className={`max-h-14 w-auto object-contain ${sponsor.logoClassName ?? ''}`}
                      src={sponsor.logo}
                    />
                    <span className="sr-only"> (opens in new tab)</span>
                  </a>
                ) : (
                  <img
                    alt={sponsor.name}
                    className={`max-h-14 w-auto object-contain ${sponsor.logoClassName ?? ''}`}
                    src={sponsor.logo}
                  />
                )}
              </div>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
