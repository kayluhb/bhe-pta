import {Link} from 'react-router';

import {Button} from '~/components/ui/Button';
import {Container} from '~/components/ui/Container';
import {GreenBand} from '~/components/ui/GreenBand';
import {TagPill} from '~/components/ui/TagPill';
import {
  annualFundCampaign,
  annualFundPath,
  corporateContributionsUrl,
} from '~/data/annual-fund-campaign';
import {getCloudflare} from '~/lib/cloudflare-context';
import {loadPublishedCampaign} from '~/lib/fundraising/campaign-store';
import {pageSeoMeta} from '~/lib/meta';
import type {Route} from './+types/get-involved';

export async function loader({context}: Route.LoaderArgs) {
  try {
    const campaign = await loadPublishedCampaign(getCloudflare(context).env.REIMBURSEMENT_DB);
    return {annualFundCampaign: campaign};
  } catch {
    return {annualFundCampaign};
  }
}

export function meta({matches}: Route.MetaArgs) {
  return pageSeoMeta(matches, {
    path: '/get-involved',
    title: 'Get Involved | Barton Hills Elementary PTA',
    description:
      'Volunteer, join the PTA, and donate to the Annual Fund at Barton Hills Elementary. Support Art, Music & PE and programs for every student.',
  });
}

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

const regularVolunteer = [
  'ACPTA & Vertical Team Rep',
  'Book Buddies',
  'Coffee Talk',
  'Courtesy',
  'Graphic Design',
  'Social Media',
  'Bulletin Board',
  'Website',
];

const intermittentVolunteer = [
  'Community Events',
  'Eagle News',
  'Grade-level Hospitality',
  'CATCH Committee',
  'Cultural Arts',
  'FUNraising',
  'Greenworks',
  'Parties with a Purpose',
  'Volunteer Coordinator',
  'Teacher Grant Program',
  'Reflections',
  'School Merchandise',
  'Scholarship Awards',
  'School Supplies',
  'Yearbook',
];

const oneTimeVolunteer = ['Carnival', 'Fall parent parties', 'Spring parent parties'];

const jumpCards = [
  {
    title: 'Volunteer',
    sub: '25+ ways to help',
    href: '#volunteer',
    primary: true,
  },
  {
    title: 'Annual Fund',
    sub: '$650 per child suggested',
    href: '#fund',
    primary: false,
  },
  {
    title: 'Sponsor',
    sub: 'For local businesses',
    href: '#sponsor',
    primary: false,
  },
  {
    title: 'Join the PTA',
    sub: 'Become a member',
    href: '#join',
    primary: false,
  },
];

export default function GetInvolved({loaderData}: Route.ComponentProps) {
  const {annualFundCampaign: campaign} = loaderData;
  const ask = campaign.suggestedAskPerChild;

  return (
    <div>
      <section className="py-12 md:py-[64px]">
        <Container>
          <h1 className="font-display text-[42px] font-extrabold tracking-[-0.035em] text-bhe-ink md:text-[clamp(48px,5vw,72px)]">
            Find your flock.
          </h1>
          <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-bhe-body md:text-[20px]">
            The PTA runs on community help. Give an hour or a semester, a gift or a sponsorship —
            every bit keeps BHE soaring.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {jumpCards.map((card) => (
              <a
                className={[
                  'rounded-card border-2 p-5 transition-colors',
                  card.primary
                    ? 'border-bhe-green bg-bhe-green text-bhe-on-green'
                    : 'border-bhe-border bg-bhe-card text-bhe-ink hover:border-bhe-green',
                ].join(' ')}
                href={card.href}
                key={card.title}
              >
                <h2 className="font-display text-xl font-bold">{card.title}</h2>
                <p
                  className={`mt-1 text-sm ${card.primary ? 'text-bhe-on-green-muted' : 'text-bhe-muted'}`}
                >
                  {card.title === 'Annual Fund' ? `$${ask} per child suggested` : card.sub}
                </p>
              </a>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-12 md:py-[64px]" id="volunteer">
        <Container>
          <h2 className="font-display text-[30px] font-extrabold text-bhe-ink md:text-[44px]">
            Volunteer opportunities
          </h2>
          <p className="mt-3 max-w-2xl text-bhe-body">
            Pick a cadence that fits your life — regular, intermittent, or one-time.
          </p>
          <a
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-bhe-green px-7 py-3.5 text-lg font-bold text-bhe-on-green hover:bg-bhe-green-2"
            href="mailto:pta@bheeagles.com?subject=Volunteer%20signup"
          >
            Email the PTA to sign up
          </a>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {[
              {
                title: 'Regular cadence',
                sub: 'Ongoing roles with a steady rhythm',
                tint: 'green' as const,
                roles: regularVolunteer,
              },
              {
                title: 'Intermittent',
                sub: 'Project-based help throughout the year',
                tint: 'gold' as const,
                roles: intermittentVolunteer,
              },
              {
                title: 'One-time',
                sub: 'Pitch in for a single event',
                tint: 'blue' as const,
                roles: oneTimeVolunteer,
              },
            ].map((group) => (
              <article
                className="rounded-card border border-bhe-border bg-bhe-card p-6"
                key={group.title}
              >
                <h3 className="font-display text-xl font-bold text-bhe-ink">{group.title}</h3>
                <p className="mt-1 text-sm text-bhe-muted">{group.sub}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.roles.map((role) => (
                    <TagPill key={role} tint={group.tint}>
                      {role}
                    </TagPill>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <GreenBand className="py-14 md:py-[72px]" id="fund">
        <Container className="flex flex-col gap-10 lg:flex-row lg:items-center">
          <div className="flex-1">
            <h2 className="font-display text-[clamp(32px,4vw,52px)] font-extrabold leading-[1.05] tracking-[-0.03em] text-bhe-on-green">
              $930 per student, every year.
            </h2>
            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-bhe-on-green-muted">
              We ask about ${ask} per child to help sustain programs AISD does not fully fund. Give
              what you can — membership is included.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" to={annualFundPath} variant="accent">
                Give to the Annual Fund
              </Button>
              <Button size="lg" to={annualFundPath} variant="on-dark">
                Annual Fund details
              </Button>
            </div>
          </div>
          <ul className="grid flex-1 gap-2 sm:grid-cols-2">
            {fundedInitiatives.map((item) => (
              <li
                className="rounded-full border border-bhe-green-line px-4 py-2.5 text-sm text-bhe-on-green"
                key={item}
              >
                {item}
              </li>
            ))}
          </ul>
        </Container>
      </GreenBand>

      <section className="py-12 md:py-[64px]">
        <Container className="grid gap-5 md:grid-cols-2">
          <div className="rounded-panel border border-bhe-border bg-bhe-card p-8" id="sponsor">
            <h2 className="font-display text-2xl font-extrabold text-bhe-ink">Become a sponsor</h2>
            <p className="mt-3 text-bhe-muted">
              Local businesses power programs and events that serve every student.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                className="inline-flex min-h-11 items-center rounded-full bg-bhe-green px-6 py-3 font-bold text-bhe-on-green"
                href={corporateContributionsUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                Become a sponsor
                <span className="sr-only"> (opens in new tab)</span>
              </a>
              <Button to="/sponsors" variant="secondary">
                View sponsor tiers
              </Button>
            </div>
          </div>
          <div className="rounded-panel bg-bhe-gold p-8 text-bhe-green" id="join">
            <h2 className="font-display text-2xl font-extrabold">Join the PTA</h2>
            <p className="mt-3 text-bhe-green/80">
              Membership is included with your Annual Fund gift. Belong to the flock.
            </p>
            <a
              className="mt-6 inline-flex min-h-11 items-center rounded-full bg-bhe-green px-6 py-3 font-bold text-bhe-on-green"
              href={campaign.giveUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Become a member
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          </div>
        </Container>
      </section>

      <section className="pb-16">
        <Container>
          <div className="rounded-panel border-2 border-bhe-green px-6 py-10 text-center md:px-12">
            <h2 className="font-display text-[28px] font-extrabold text-bhe-ink md:text-[36px]">
              Ready to make a difference?
            </h2>
            <a
              className="mt-6 inline-flex min-h-12 items-center rounded-full bg-bhe-green px-8 py-3.5 text-lg font-bold text-bhe-on-green"
              href="mailto:pta@bheeagles.com"
            >
              Email pta@bheeagles.com
            </a>
          </div>
        </Container>
      </section>
    </div>
  );
}
