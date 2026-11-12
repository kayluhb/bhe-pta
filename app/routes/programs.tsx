import {Button} from '~/components/ui/Button';
import {GreenCta} from '~/components/ui/GreenCta';
import {PageHero} from '~/components/ui/PageHero';
import {mergeParentMeta} from '~/lib/meta';
import type {Route} from './+types/programs';

export function meta({matches}: Route.MetaArgs) {
  return mergeParentMeta(matches, [
    {title: 'Programs | Barton Hills Elementary PTA'},
    {
      name: 'description',
      content:
        'Explore PTA programs: Art, Music & PE staffing, academic enrichment, teacher grants, Cultural Arts, and more.',
    },
  ]);
}

// ─── Data ────────────────────────────────────────────────────────────────────

const programs = [
  {
    name: 'Art, Music & PE staffing',
    description:
      'The largest single PTA investment: funding the final third of Music, Art, and PE teaching roles so every Eagle gets a full specials program.',
    color: 'bg-bhe-green',
    borderColor: 'border-bhe-green',
    icon: (
      <svg
        aria-hidden="true"
        className="h-8 w-8"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M6 21a3 3 0 100-6 3 3 0 000 6zM18 19a3 3 0 100-6 3 3 0 000 6z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: 'Academic Enrichment & Reflections',
    description:
      'After-school and extracurricular learning, including the Reflections arts program and field trips that take students beyond the classroom.',
    color: 'bg-bhe-gold',
    borderColor: 'border-bhe-gold',
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
    name: 'Teacher Grant Program',
    description:
      'Fall and spring grants so teachers can fund classroom projects, supplies, and learning tools their students need most.',
    color: 'bg-bhe-green-2',
    borderColor: 'border-bhe-green-2',
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
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: 'Cultural Arts',
    description:
      'Performances and presentations by musicians, writers, and artists that bring cultural enrichment into the school day.',
    color: 'bg-bhe-green',
    borderColor: 'border-bhe-green',
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
    name: 'Greenworks',
    description:
      'Outdoor gardens, landscaping, and campus care that teach environmental stewardship and keep BHE beautiful.',
    color: 'bg-bhe-green-2',
    borderColor: 'border-bhe-green-2',
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
    description:
      'College scholarships for Barton Hills alumni, honoring Nick Akery and supporting graduates as they continue their education.',
    color: 'bg-bhe-green',
    borderColor: 'border-bhe-green',
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
    name: 'Counselor & student support',
    description:
      'Materials and event support for the school counselor, plus classroom snacks and resources that help every student feel ready to learn.',
    color: 'bg-bhe-gold',
    borderColor: 'border-bhe-gold',
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
  {
    name: 'Teacher appreciation',
    description:
      'Monthly hospitality, end-of-semester gifts, lounge coffee and food, and recognition for life events and retirements.',
    color: 'bg-bhe-green-2',
    borderColor: 'border-bhe-green-2',
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
          d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: 'Library & literacy',
    description:
      'Books, ebooks, and supplemental materials for the library and reading specialist so students always have something great to read.',
    color: 'bg-bhe-green',
    borderColor: 'border-bhe-green',
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
          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: 'P.E. / Ninja Course',
    description:
      'Equipment and the annual spring Ninja Course that keep PE active, challenging, and fun for every grade.',
    color: 'bg-bhe-gold',
    borderColor: 'border-bhe-gold',
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
          d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: 'Unified Champions',
    description:
      'Special Olympics inclusion programming that brings students with and without intellectual disabilities together through sports and friendship.',
    color: 'bg-bhe-green-2',
    borderColor: 'border-bhe-green-2',
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
          d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-7.54 0"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: 'School Improvements',
    description:
      'Campus projects like hallway painting, blacktop care, HEPA filters, and other facilities work that keep the building ready for students.',
    color: 'bg-bhe-green',
    borderColor: 'border-bhe-green',
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
          d="M11.42 15.17l-5.1-5.1m0 0L12 4.37l5.68 5.7m-11.38 0h11.38M3.75 21h16.5M4.5 10.5V21m15-10.5V21"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: 'Community events',
    description:
      'After-school gatherings that build community among families, teachers, and neighbors throughout the year.',
    color: 'bg-bhe-gold',
    borderColor: 'border-bhe-gold',
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
          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function Programs() {
  return (
    <div>
      {/* ── 1. Page Banner ───────────────────────────────────────────────── */}
      <PageHero lead="Enriching the educational experience for every Eagle" title="Our Programs" />

      {/* ── 2. Program Cards ─────────────────────────────────────────────── */}
      <section className="bg-bhe-paper py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 space-y-8">
          {programs.map((program) => (
            <div
              className="rounded-card border border-bhe-border bg-bhe-card p-8 md:p-10"
              key={program.name}
            >
              <div className="flex items-start gap-5">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-tile text-white ${program.color}`}
                >
                  {program.icon}
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-bhe-ink md:text-3xl">
                    {program.name}
                  </h2>
                  <p className="mt-3 text-lg leading-relaxed text-bhe-ink/70">
                    {program.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <GreenCta
        action={
          <Button size="lg" to="/get-involved" variant="accent">
            Get Involved
          </Button>
        }
        lead="Our programs are made possible by the generous support of parents, families, and community members. Get involved and help us continue to make a difference."
        title="Support Our Programs"
      />
    </div>
  );
}
