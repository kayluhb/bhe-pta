import type { Route } from "./+types/about";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "About | Barton Hills Elementary PTA" },
    {
      name: "description",
      content:
        "Learn about the BHE PTA mission, initiatives, leadership, and how we support Barton Hills Elementary.",
    },
  ];
}

// ─── Data ────────────────────────────────────────────────────────────────────

const initiatives = [
  {
    title: "Academic Enrichment",
    description:
      "Cultural Arts Program and PTA Reflections Program bringing creative and intellectual opportunities to every student.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    title: "Parent Support Series",
    description:
      "Speaker series and workshops focusing on Diversity, Equity & Inclusion topics for our school community.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    title: "Nick Akery Scholarship",
    description:
      "Supporting Barton Hills Elementary alumni with college scholarships to continue their educational journey.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    title: "Environment Programs",
    description:
      "Organic garden and composting programs teaching students environmental stewardship and responsibility.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V10m0 0c0-4.418 3.582-8 8-8 0 4.418-3.582 8-8 8zm0 0c0-3.314-2.686-6-6-6 0 3.314 2.686 6 6 6z" />
      </svg>
    ),
  },
  {
    title: "The BHE Annual Fund",
    description:
      "Our yearly fundraising campaign ensuring every student has access to enriching programs and resources.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
  {
    title: "Other Fundraising Opportunities",
    description:
      "Spirit nights, merchandise sales, and community partnerships that bring our school together while raising funds.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  },
];

const boardMembers = [
  { name: "Becky Jeanes", role: "President" },
  { name: "Tiffany Munster", role: "Vice President" },
  { name: "Caleb Brown", role: "Treasurer" },
  { name: "Jamie Husbands", role: "Secretary" },
];

const documents = [
  { title: "PTA Bylaws", type: "PDF" },
  { title: "Meeting Minutes — January 2026", type: "PDF" },
  { title: "Meeting Minutes — December 2025", type: "PDF" },
  { title: "Meeting Minutes — November 2025", type: "PDF" },
  { title: "Annual Budget 2025-2026", type: "PDF" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function About() {
  return (
    <div>
      {/* ── 1. Page Banner ───────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-eagle-blue to-night-blue py-16 md:py-24 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, transparent, transparent 60px, #d4a843 60px, #d4a843 62px)",
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white">
            About Our PTA
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Building community, supporting education, empowering every Eagle
          </p>
          <div className="mt-6 h-1 w-20 bg-spirit-gold rounded-full mx-auto" />
        </div>
      </section>

      {/* ── 2. Mission ───────────────────────────────────────────────────── */}
      <section className="bg-warm-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal">
            Our Mission
          </h2>
          <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full mx-auto" />
          <p className="mt-8 text-lg md:text-xl text-charcoal/70 leading-relaxed">
            BHE is supported by an active PTA committed to providing significant
            support for our teachers and students. Our PTA would like every
            parent to be involved in our mission!
          </p>
        </div>
      </section>

      {/* ── 3. Key Initiatives ───────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal">
              Key Initiatives
            </h2>
            <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initiatives.map((item) => (
              <div
                key={item.title}
                className="group bg-warm-white rounded-lg shadow-md border-b-4 border-spirit-gold p-8 transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="h-14 w-14 rounded-full bg-eagle-blue/10 flex items-center justify-center mb-5 text-eagle-blue">
                  {item.icon}
                </div>
                <h3 className="font-heading font-bold text-xl text-charcoal">
                  {item.title}
                </h3>
                <p className="mt-3 text-charcoal/70 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. PTA Board — Our Leadership ────────────────────────────────── */}
      <section className="bg-warm-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal">
              Our 25–26 PTA Officers
            </h2>
            <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full mx-auto" />
            <p className="mt-4 text-charcoal/70 max-w-2xl mx-auto">
              PTA Leadership Team — the dedicated volunteers who lead our PTA
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {boardMembers.map((member, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-md p-8 text-center transition-all duration-200 hover:shadow-lg"
              >
                {/* Circular photo placeholder */}
                <div className="mx-auto h-24 w-24 rounded-full bg-eagle-blue/10 border-4 border-spirit-gold/30 flex items-center justify-center mb-5">
                  <svg
                    className="h-10 w-10 text-eagle-blue/40"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                </div>
                <h3 className="font-heading font-bold text-lg text-charcoal">
                  {member.name}
                </h3>
                <p className="mt-1 text-spirit-gold font-heading font-semibold text-sm">
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Meeting Minutes & Bylaws (hidden for now) ────────────────────── */}
      {false && (
        <section className="bg-white py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4">
            <div className="mb-10">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal">
                Meeting Minutes & Bylaws
              </h2>
              <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full" />
            </div>

            <div className="space-y-3">
              {documents.map((doc) => (
                <a
                  key={doc.title}
                  href="#"
                  className="flex items-center gap-4 bg-warm-white rounded-lg p-5 shadow-sm border border-charcoal/5 hover:shadow-md hover:border-spirit-gold/30 transition-all duration-200 group"
                >
                  <div className="shrink-0 h-10 w-10 rounded-lg bg-eagle-blue/10 flex items-center justify-center text-eagle-blue group-hover:bg-eagle-blue group-hover:text-white transition-colors">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-charcoal group-hover:text-eagle-blue transition-colors">
                      {doc.title}
                    </p>
                    <p className="text-sm text-charcoal/70">{doc.type}</p>
                  </div>
                  <svg
                    className="h-5 w-5 text-charcoal/30 group-hover:text-eagle-blue transition-colors shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 6. Join Us CTA ───────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-eagle-blue to-night-blue py-16 md:py-24 overflow-hidden">
        <div
          className="absolute top-0 right-0 w-1/2 h-full bg-spirit-gold/5"
          style={{ clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">
            Join Us
          </h2>
          <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full mx-auto" />
          <p className="mt-6 text-lg text-white/90 leading-relaxed">
            Membership in the Barton Hills PTA helps support our wonderful
            students, teachers, staff, and programs.
          </p>
          <a
            href="https://my.cheddarup.com/c/bhe-pta-annual-fund-drive-2025-26"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center bg-spirit-gold text-night-blue font-heading font-bold text-lg px-8 py-3.5 rounded-full hover:bg-spirit-gold/90 transition-all duration-200 hover:shadow-lg hover:shadow-spirit-gold/25"
          >
            Join PTA
          </a>
        </div>
      </section>
    </div>
  );
}
