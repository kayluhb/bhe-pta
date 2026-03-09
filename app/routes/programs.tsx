import {Link} from 'react-router';
import {mergeParentMeta} from '~/lib/meta';
import type {Route} from './+types/programs';

export function meta({matches}: Route.MetaArgs) {
  return mergeParentMeta(matches, [
    {title: 'Programs | Barton Hills Elementary PTA'},
    {
      name: 'description',
      content:
        'Explore PTA programs: Cultural Arts, Reflections, Greenworks, scholarships, and more.',
    },
  ]);
}

// ─── Data ────────────────────────────────────────────────────────────────────

const programs = [
  {
    name: 'Cultural Arts Program',
    description:
      'Presentations throughout the year by musicians, writers, and actors from around the world. These enriching performances expose students to diverse art forms and cultural traditions, sparking creativity and broadening their understanding of the world.',
    color: 'bg-eagle-blue',
    borderColor: 'border-eagle-blue',
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
    name: 'PTA Reflections',
    description:
      'A nationwide arts recognition program for students, encouraging artistic expression in literature, visual arts, music composition, photography, film, and dance choreography. Students explore a theme and create original works that are judged at school, council, district, and national levels.',
    color: 'bg-spirit-gold',
    borderColor: 'border-spirit-gold',
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
    name: 'Greenworks / Environment',
    description:
      'Organic garden and composting programs teaching environmental stewardship. Students learn about sustainable agriculture, the life cycle of plants, and the importance of caring for our planet through hands-on activities in our school garden.',
    color: 'bg-creek-green',
    borderColor: 'border-creek-green',
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
      'Supporting Barton Hills Elementary alumni with college scholarships. This scholarship honors the memory of Nick Akery and helps graduates as they continue their educational journey beyond elementary school.',
    color: 'bg-eagle-blue',
    borderColor: 'border-eagle-blue',
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
    name: 'Parent Support Series',
    description:
      'Speaker series focusing on diversity, equity, and inclusion topics. These sessions provide families with tools, resources, and perspectives to support their children and build a more inclusive school community.',
    color: 'bg-spirit-gold',
    borderColor: 'border-spirit-gold',
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
          d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: 'Social-Emotional Learning',
    description:
      'Programs supporting the emotional and social development of our students. Through structured activities and curriculum, students build resilience, empathy, self-awareness, and healthy relationship skills that serve them throughout their lives.',
    color: 'bg-creek-green',
    borderColor: 'border-creek-green',
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
    name: 'Academic Enrichment',
    description:
      'Funding for supplemental academic programs, classroom materials, and enrichment opportunities that go beyond the standard curriculum. This is one of our largest investments, ensuring every Eagle has access to high-quality learning experiences.',
    color: 'bg-eagle-blue',
    borderColor: 'border-eagle-blue',
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
    name: 'Teacher Grant Program',
    description:
      'Grants awarded to teachers for innovative classroom projects, supplies, and learning tools. Teachers submit proposals for materials and experiences that enhance student learning, and the PTA funds approved projects throughout the school year.',
    color: 'bg-spirit-gold',
    borderColor: 'border-spirit-gold',
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
    name: 'Community Events',
    description:
      'Family-friendly events throughout the year that bring our school community together. From movie nights and potlucks to seasonal celebrations, these gatherings strengthen the bonds between families, teachers, and staff.',
    color: 'bg-creek-green',
    borderColor: 'border-creek-green',
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
  {
    name: 'Class Gardens',
    description:
      'Hands-on gardening projects where students cultivate and maintain their own class garden plots. Students learn about plant science, nutrition, and teamwork while growing flowers, herbs, and vegetables right on our school grounds.',
    color: 'bg-eagle-blue',
    borderColor: 'border-eagle-blue',
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
          d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: 'Library Support',
    description:
      'Funding for new books, reading materials, and library resources that keep our school library stocked with engaging, diverse, and age-appropriate literature for all students.',
    color: 'bg-spirit-gold',
    borderColor: 'border-spirit-gold',
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
          d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: 'Teacher Appreciation',
    description:
      'Recognizing and celebrating the dedication of our teachers and staff throughout the year. From end-of-semester gifts and teacher lounge refreshments to retirement celebrations, we ensure our educators feel valued and supported.',
    color: 'bg-creek-green',
    borderColor: 'border-creek-green',
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
    name: 'Unified Champions',
    description:
      'A Special Olympics program that promotes inclusion by bringing together students with and without intellectual disabilities through sports and other activities. Building friendships, teamwork, and understanding across our school community.',
    color: 'bg-eagle-blue',
    borderColor: 'border-eagle-blue',
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
    name: 'P.E. Fund',
    description:
      'Supporting our physical education program with equipment, supplies, and resources that keep students active and healthy. From new sports equipment to fitness activities, this fund helps ensure every student has the tools for an engaging P.E. experience.',
    color: 'bg-spirit-gold',
    borderColor: 'border-spirit-gold',
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
          d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.491 48.491 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: 'School Improvements',
    description:
      'Capital investments in our school facilities and campus to create a better learning environment. From playground upgrades to classroom improvements, these projects benefit students and staff for years to come.',
    color: 'bg-creek-green',
    borderColor: 'border-creek-green',
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
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function Programs() {
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
            Our Programs
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Enriching the educational experience for every Eagle
          </p>
          <div className="mt-6 h-1 w-20 bg-spirit-gold rounded-full mx-auto" />
        </div>
      </section>

      {/* ── 2. Program Cards ─────────────────────────────────────────────── */}
      <section className="bg-warm-white py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 space-y-8">
          {programs.map((program) => (
            <div
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
              key={program.name}
            >
              {/* Color accent bar */}
              <div className={`h-2 ${program.color}`} />
              <div className="p-8 md:p-10">
                <div className="flex items-start gap-5">
                  <div
                    className={`shrink-0 h-14 w-14 rounded-lg ${program.color} flex items-center justify-center text-white`}
                  >
                    {program.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-heading font-bold text-charcoal">
                      {program.name}
                    </h2>
                    <p className="mt-3 text-charcoal/70 text-lg leading-relaxed">
                      {program.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Get Involved CTA ──────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-eagle-blue to-night-blue py-16 md:py-24 overflow-hidden">
        <div
          className="absolute top-0 right-0 w-1/2 h-full bg-spirit-gold/5"
          style={{clipPath: 'polygon(100% 0, 0 100%, 100% 100%)'}}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">
            Support Our Programs
          </h2>
          <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full mx-auto" />
          <p className="mt-6 text-lg text-white/90 leading-relaxed">
            Our programs are made possible by the generous support of parents, families, and
            community members. Get involved and help us continue to make a difference.
          </p>
          <Link
            className="mt-8 inline-flex items-center bg-spirit-gold text-night-blue font-heading font-bold text-lg px-8 py-3.5 rounded-full hover:bg-spirit-gold/90 transition-all duration-200 hover:shadow-lg hover:shadow-spirit-gold/25"
            to="/get-involved"
          >
            Get Involved
          </Link>
        </div>
      </section>
    </div>
  );
}
