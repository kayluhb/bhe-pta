import {Container} from '~/components/ui/Container';
import {GreenCta} from '~/components/ui/GreenCta';
import {PageHero} from '~/components/ui/PageHero';
import {mergeParentMeta} from '~/lib/meta';
import type {Route} from './+types/nick-akery-scholarship';

export function meta({matches}: Route.MetaArgs) {
  return mergeParentMeta(matches, [
    {title: 'Nick Akery Scholarship | Barton Hills Elementary PTA'},
    {
      name: 'description',
      content:
        'Apply for the 2027 Nick Akery Scholarship: $1,500 and $1,000 awards for Barton Hills Elementary alumni graduating seniors. Applications due April 9, 2027.',
    },
  ]);
}

const APPLICATION_PACKET_URL =
  'https://docs.google.com/document/d/1tIlu-nPzBqlapymKLvfybQ4X9kqG3Q-wuLzDz6i2bYA/edit?usp=sharing';

const APPLICATION_FORM_URL = 'https://forms.gle/D5iM2rEhxPE1KD7q9';
const TEACHER_REC_FORM_URL = 'https://forms.gle/nWpCax4DBNWvciwA6';
const COMMUNITY_REC_FORM_URL = 'https://forms.gle/XsE13i2irnyAgLxd9';
const SCHOLARSHIP_EMAIL = 'Scholarship@Bheeagles.com';

const accentLinkClass =
  'inline-flex min-h-12 items-center justify-center rounded-full bg-bhe-gold px-7 py-3.5 text-lg font-bold text-bhe-green hover:brightness-95';
const secondaryLinkClass =
  'inline-flex min-h-12 items-center justify-center rounded-full border-2 border-bhe-green bg-transparent px-7 py-3.5 text-lg font-bold text-bhe-green hover:bg-bhe-tint-green';

const eligibility = [
  'Graduating high school senior',
  'Cumulative GPA of 3.0 or above',
  'Attended Barton Hills Elementary for at least two years',
  'Intend to continue education after high school (university, college, junior college, or vocational school)',
];

const forms = [
  {
    href: APPLICATION_FORM_URL,
    label: 'Student application form',
    detail: 'Google Form for the graduating senior',
  },
  {
    href: TEACHER_REC_FORM_URL,
    label: 'Teacher recommendation form',
    detail: 'One teacher recommendation required',
  },
  {
    href: COMMUNITY_REC_FORM_URL,
    label: 'Community recommendation form',
    detail: 'One community member recommendation required',
  },
];

export default function NickAkeryScholarship() {
  return (
    <div>
      <PageHero
        lead="Two awards for Barton Hills alumni graduating seniors — $1,500 and $1,000 for 2027."
        title="Nick Akery Scholarship"
      />

      <section className="bg-bhe-paper py-14 md:py-20">
        <Container>
          <div className="mx-auto max-w-3xl">
            <p className="text-lg leading-relaxed text-bhe-body md:text-xl">
              The Barton Hills Elementary PTA recognizes two BHE alumni each year for academic
              strength, extracurricular and community involvement, and strong personal character.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                {label: 'Awards', value: '$1,500 & $1,000'},
                {label: 'Deadline', value: 'April 9, 2027 · 5:00 p.m.'},
                {label: 'Notify by', value: 'May 1, 2027'},
              ].map((item) => (
                <div
                  className="rounded-card border border-bhe-border bg-bhe-card px-5 py-4"
                  key={item.label}
                >
                  <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-bhe-green-2">
                    {item.label}
                  </p>
                  <p className="mt-1.5 font-display text-xl font-bold text-bhe-ink">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                className={accentLinkClass}
                href={APPLICATION_PACKET_URL}
                rel="noopener noreferrer"
                target="_blank"
              >
                Open application packet
                <span className="sr-only"> (opens in new tab)</span>
              </a>
              <a
                className={secondaryLinkClass}
                href={APPLICATION_FORM_URL}
                rel="noopener noreferrer"
                target="_blank"
              >
                Start the application
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            </div>
            <p className="mt-3 text-sm text-bhe-muted">
              The full application packet is a Google Doc with policies, deadlines, and every form
              link for counselors and applicants.
            </p>
          </div>
        </Container>
      </section>

      <section className="border-t border-bhe-border bg-bhe-paper-2/40 py-14 md:py-20">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-3xl font-extrabold tracking-[-0.02em] text-bhe-ink md:text-4xl">
              Who can apply
            </h2>
            <ul className="mt-6 space-y-3">
              {eligibility.map((item) => (
                <li className="flex gap-3 text-[15px] leading-relaxed text-bhe-body" key={item}>
                  <span aria-hidden="true" className="mt-0.5 font-bold text-bhe-green-2">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[15px] leading-relaxed text-bhe-body">
              Scholarship (1) weighs academics, extracurricular involvement, community involvement,
              and character. Scholarship (2) emphasizes community involvement outside school,
              especially contributions to Barton Hills and other area elementary schools. One student
              cannot receive both awards.
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-bhe-paper py-14 md:py-20">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-3xl font-extrabold tracking-[-0.02em] text-bhe-ink md:text-4xl">
              How to apply
            </h2>
            <ol className="mt-6 list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-bhe-body">
              <li>Complete the student Google Form application.</li>
              <li>
                Ask one teacher and one other community member to submit recommendation forms by the
                deadline.
              </li>
              <li>
                Applications are considered only when both recommendation forms have been received.
              </li>
            </ol>

            <ul className="mt-8 space-y-3">
              {forms.map((form) => (
                <li key={form.href}>
                  <a
                    className="flex flex-col rounded-card border border-bhe-border bg-bhe-card px-5 py-4 transition-colors hover:border-bhe-green sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    href={form.href}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span>
                      <span className="font-display text-lg font-bold text-bhe-ink">{form.label}</span>
                      <span className="mt-1 block text-sm text-bhe-muted">{form.detail}</span>
                    </span>
                    <span className="mt-2 text-sm font-bold text-bhe-green sm:mt-0">
                      Open form →
                      <span className="sr-only"> (opens in new tab)</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <p className="mt-8 text-[15px] leading-relaxed text-bhe-body">
              Questions go to{' '}
              <a
                className="font-bold text-bhe-green underline-offset-2 hover:underline"
                href={`mailto:${SCHOLARSHIP_EMAIL}`}
              >
                {SCHOLARSHIP_EMAIL}
              </a>
              .
            </p>
          </div>
        </Container>
      </section>

      <GreenCta
        action={
          <a
            className={accentLinkClass}
            href={APPLICATION_PACKET_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            View full application packet
            <span className="sr-only"> (opens in new tab)</span>
          </a>
        }
        lead="Share this page with counselors and graduating BHE alumni. The packet has the current dates, award amounts, and every form link in one place."
        title="Counselors and families"
      />
    </div>
  );
}
