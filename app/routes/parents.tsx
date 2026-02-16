import type { Route } from "./+types/parents";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Parents | Barton Hills Elementary PTA" },
    {
      name: "description",
      content:
        "Essential information and resources for Barton Hills Elementary parents and families.",
    },
  ];
}

// ─── Data ────────────────────────────────────────────────────────────────────

const hours = [
  { label: "Main Office", time: "Mon-Fri 7:30 AM - 4:00 PM" },
  { label: "Student Hours", time: "Mon-Fri 7:40 AM - 3:10 PM" },
  { label: "Library", time: "Mon-Fri 8:00 AM - 3:30 PM" },
];

const quickLinks = [
  {
    title: "AISD Parent Portal",
    url: "https://portal.austinisd.org/",
    description: "Access grades, attendance, and student information",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    title: "SchoolCafe / Lunch Menus",
    url: "https://www.schoolcafe.com",
    description: "View daily menus and manage lunch accounts",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
      </svg>
    ),
  },
  {
    title: "Official School Website",
    url: "https://bartonhills.austinschools.org",
    description: "Barton Hills Elementary official AISD page",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    ),
  },
  {
    title: "Austin ISD Homepage",
    url: "https://www.austinisd.org",
    description: "District news, policies, and resources",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 01-1.161.886l-.143.048a1.107 1.107 0 00-.57 1.664c.369.555.169 1.307-.427 1.592L9 13.125l.423 1.059a.956.956 0 01-1.652.928l-.679-.906a1.125 1.125 0 00-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 00-8.862 12.872M12.75 3.031a9 9 0 016.69 14.036m0 0l-.177-.529A2.25 2.25 0 0017.128 15H16.5l-.324-.324a1.453 1.453 0 00-2.328.377l-.036.073a1.586 1.586 0 01-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438a2.253 2.253 0 01-1.699 2.583l-.41.087m0 0a9 9 0 01-3.566-1.29" />
      </svg>
    ),
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function Parents() {
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
            Parents
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Essential information and resources for Barton Hills Elementary
            families
          </p>
          <div className="mt-6 h-1 w-20 bg-spirit-gold rounded-full mx-auto" />
        </div>
      </section>

      {/* ── 2. School Overview Card ──────────────────────────────────────── */}
      <section className="bg-warm-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-eagle-blue p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-white">
                School Hours
              </h2>
            </div>
            <div className="p-6 md:p-8">
              <table className="w-full">
                <tbody className="divide-y divide-charcoal/10">
                  {hours.map((row) => (
                    <tr key={row.label}>
                      <td className="py-4 pr-4">
                        <span className="font-heading font-bold text-charcoal">
                          {row.label}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <span className="text-charcoal/70 font-medium">
                          {row.time}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Contact Info ──────────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal">
              Contact Information
            </h2>
            <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full mx-auto" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Phone */}
            <div className="bg-warm-white rounded-lg shadow-md p-6 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-eagle-blue/10 flex items-center justify-center text-eagle-blue mb-4">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                  />
                </svg>
              </div>
              <p className="font-heading font-bold text-charcoal text-sm">
                Phone
              </p>
              <a
                href="tel:+15124142013"
                className="text-eagle-blue hover:text-spirit-gold transition-colors text-sm mt-1 inline-block"
              >
                (512) 414-2013
              </a>
            </div>

            {/* Fax */}
            <div className="bg-warm-white rounded-lg shadow-md p-6 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-eagle-blue/10 flex items-center justify-center text-eagle-blue mb-4">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m0 0a48.159 48.159 0 0110.5 0m-10.5 0V3.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"
                  />
                </svg>
              </div>
              <p className="font-heading font-bold text-charcoal text-sm">
                Fax
              </p>
              <p className="text-charcoal/70 text-sm mt-1">(512) 841-3849</p>
            </div>

            {/* Email */}
            <div className="bg-warm-white rounded-lg shadow-md p-6 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-eagle-blue/10 flex items-center justify-center text-eagle-blue mb-4">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>
              <p className="font-heading font-bold text-charcoal text-sm">
                Email
              </p>
              <a
                href="mailto:bhe@austinisd.org"
                className="text-eagle-blue hover:text-spirit-gold transition-colors text-sm mt-1 inline-block"
              >
                bhe@austinisd.org
              </a>
            </div>

            {/* Address */}
            <div className="bg-warm-white rounded-lg shadow-md p-6 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-eagle-blue/10 flex items-center justify-center text-eagle-blue mb-4">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
              </div>
              <p className="font-heading font-bold text-charcoal text-sm">
                Address
              </p>
              <p className="text-charcoal/70 text-sm mt-1">
                2108 Barton Hills Dr
                <br />
                Austin, TX 78704
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Quick Links ───────────────────────────────────────────────── */}
      <section className="bg-warm-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal">
              Quick Links
            </h2>
            <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full mx-auto" />
            <p className="mt-4 text-charcoal/70 max-w-2xl mx-auto">
              Helpful resources for Barton Hills Elementary families
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {quickLinks.map((link) => (
              <a
                key={link.title}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-lg shadow-md p-6 border-l-4 border-eagle-blue hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 h-12 w-12 rounded-lg bg-eagle-blue/10 flex items-center justify-center text-eagle-blue group-hover:bg-eagle-blue group-hover:text-white transition-colors">
                    {link.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-charcoal group-hover:text-eagle-blue transition-colors">
                      {link.title}
                    </h3>
                    <p className="mt-1 text-sm text-charcoal/70">
                      {link.description}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-heading font-bold text-eagle-blue group-hover:text-spirit-gold transition-colors">
                      Visit
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
