import { Link } from "react-router";
import type { Route } from "./+types/get-involved";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Get Involved | Barton Hills Elementary PTA" },
    {
      name: "description",
      content:
        "Volunteer, join the PTA, and support the Annual Fund at Barton Hills Elementary.",
    },
  ];
}

// ─── Data ────────────────────────────────────────────────────────────────────

const fundedInitiatives = [
  "Library, music, art, and PE materials",
  "Faculty supplies and training",
  "Student t-shirts and yearbooks",
  "Cultural arts programs",
  "Social-emotional learning",
  "Outdoor maintenance",
  "PE equipment",
  "HEPA filters",
  "Technology",
  "Academic enrichment",
  "School gardens",
];

const regularVolunteer = [
  "ACPTA & Vertical Team Rep",
  "Book Buddies",
  "Coffee Talk",
  "Courtesy",
  "Graphic Design",
  "Social Media",
  "Bulletin Board",
  "Website",
];

const intermittentVolunteer = [
  "Community Events",
  "Eagle News",
  "Grade-level Hospitality",
  "CATCH Committee",
  "Cultural Arts",
  "FUNraising",
  "Greenworks",
  "Parties with a Purpose",
  "Parent Support Series",
  "Volunteer Coordinator",
  "Teacher Grant Program",
  "Reflections",
  "School Merchandise",
  "Scholarship Awards",
  "School Supplies",
  "Yearbook",
];

const oneTimeVolunteer = [
  "Carnival contributions",
  "Seasonal parent parties (fall and spring)",
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function GetInvolved() {
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
            Get Involved
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
            We cannot do what we do without your help and participation!
          </p>
          <div className="mt-6 h-1 w-20 bg-spirit-gold rounded-full mx-auto" />
        </div>
      </section>

      {/* ── 2. Annual Fund Hero ──────────────────────────────────────────── */}
      <section className="bg-warm-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-eagle-blue to-night-blue p-8 md:p-12">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <p className="text-spirit-gold font-heading font-bold text-sm uppercase tracking-wider">
                    The BHE Annual Fund
                  </p>
                  <h2 className="mt-2 text-3xl md:text-4xl font-heading font-bold text-white">
                    Every Dollar Counts
                  </h2>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-5xl md:text-6xl font-heading font-bold text-spirit-gold">
                    $600+
                  </p>
                  <p className="text-white/70 text-sm mt-1">
                    per student annually
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-12">
              <p className="text-charcoal/70 text-lg leading-relaxed">
                The PTA spends over $600 per student every year on programs and
                resources that directly benefit our children. We request a
                contribution of{" "}
                <span className="font-bold text-charcoal">
                  $200 per child
                </span>{" "}
                to help sustain these vital programs.
              </p>

              <div className="mt-8">
                <h3 className="font-heading font-bold text-lg text-charcoal mb-4">
                  Your contributions fund:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fundedInitiatives.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <svg
                        className="h-5 w-5 text-creek-green shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-charcoal/70">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10">
                <a
                  href="#"
                  className="inline-flex items-center bg-spirit-gold text-night-blue font-heading font-bold text-lg px-8 py-3.5 rounded-full hover:bg-spirit-gold/90 transition-all duration-200 hover:shadow-lg hover:shadow-spirit-gold/25"
                >
                  Donate Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Volunteer Opportunities ───────────────────────────────────── */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal">
              Volunteer Opportunities
            </h2>
            <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Regular Cadence */}
            <div className="bg-warm-white rounded-lg shadow-md p-8 border-t-4 border-eagle-blue">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-eagle-blue flex items-center justify-center">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                    />
                  </svg>
                </div>
                <h3 className="font-heading font-bold text-xl text-charcoal">
                  Regular Cadence
                </h3>
              </div>
              <ul className="space-y-3">
                {regularVolunteer.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-charcoal/70"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-eagle-blue shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Intermittent */}
            <div className="bg-warm-white rounded-lg shadow-md p-8 border-t-4 border-spirit-gold">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-spirit-gold flex items-center justify-center">
                  <svg
                    className="h-5 w-5 text-night-blue"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                    />
                  </svg>
                </div>
                <h3 className="font-heading font-bold text-xl text-charcoal">
                  Intermittent
                </h3>
              </div>
              <ul className="space-y-3">
                {intermittentVolunteer.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-charcoal/70"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-spirit-gold shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* One-Time */}
            <div className="bg-warm-white rounded-lg shadow-md p-8 border-t-4 border-creek-green">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-creek-green flex items-center justify-center">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-heading font-bold text-xl text-charcoal">
                  One-Time
                </h3>
              </div>
              <ul className="space-y-3">
                {oneTimeVolunteer.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-charcoal/70"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-creek-green shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Join PTA ──────────────────────────────────────────────────── */}
      <section className="bg-warm-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 border-l-4 border-spirit-gold">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal">
              Join PTA
            </h2>
            <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full" />
            <p className="mt-6 text-lg text-charcoal/70 leading-relaxed">
              Please consider joining and donating if you can. Your membership
              and support directly impacts every student at Barton Hills
              Elementary. Together, we can continue to provide the programs,
              resources, and community that make our school exceptional.
            </p>
            <div className="mt-8">
              <a
                href="#"
                className="inline-flex items-center bg-eagle-blue text-white font-heading font-bold text-lg px-8 py-3.5 rounded-full hover:bg-eagle-blue/90 transition-all duration-200 hover:shadow-lg"
              >
                Join & Pay Membership
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Sign Up CTA ───────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-eagle-blue to-night-blue py-16 md:py-24 overflow-hidden">
        <div
          className="absolute top-0 right-0 w-1/2 h-full bg-spirit-gold/5"
          style={{ clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">
            Ready to Make a Difference?
          </h2>
          <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full mx-auto" />
          <p className="mt-6 text-lg text-white/80 leading-relaxed">
            Whether you have an hour or an entire semester, there is a place for
            you in our PTA community.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="#"
              className="inline-flex items-center bg-spirit-gold text-night-blue font-heading font-bold text-lg px-8 py-3.5 rounded-full hover:bg-spirit-gold/90 transition-all duration-200 hover:shadow-lg hover:shadow-spirit-gold/25"
            >
              Sign Up to Volunteer
            </a>
            <a
              href="mailto:pta@bheeagles.com"
              className="inline-flex items-center border-2 border-white text-white font-heading font-bold text-lg px-8 py-3.5 rounded-full hover:bg-white/10 transition-all duration-200"
            >
              Email PTA
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
