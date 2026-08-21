import {Link} from 'react-router';
import {mergeParentMeta} from '~/lib/meta';
import type {Route} from './+types/parents';

export function meta({matches}: Route.MetaArgs) {
  return mergeParentMeta(matches, [
    {title: 'Parents | Barton Hills Elementary PTA'},
    {
      name: 'description',
      content:
        'Essential information and resources for Barton Hills Elementary parents and families.',
    },
  ]);
}

// ─── Data ────────────────────────────────────────────────────────────────────

const hours = [
  {label: 'Main Office', time: 'Mon-Fri 7:30 AM - 4:00 PM'},
  {label: 'Student Hours', time: 'Mon-Fri 7:40 AM - 3:10 PM'},
  {label: 'Library', time: 'Mon-Fri 8:00 AM - 3:30 PM'},
];

const contactCards = [
  {
    label: 'Phone',
    href: 'tel:+15124142013',
    accent: true,
    value: '(512) 414-2013',
    icon: (
      <svg
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <title>Phone</title>
        <path
          d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: 'Fax',
    href: 'tel:+15128413849',
    accent: false,
    value: '(512) 841-3849',
    icon: (
      <svg
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <title>Fax</title>
        <path
          d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m0 0a48.159 48.159 0 0110.5 0m-10.5 0V3.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: 'Email',
    href: 'mailto:bhe@austinisd.org',
    accent: true,
    value: 'bhe@austinisd.org',
    icon: (
      <svg
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <title>Email</title>
        <path
          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: 'Address',
    href: 'https://www.google.com/maps/search/?api=1&query=2108+Barton+Hills+Dr,+Austin,+TX+78704',
    accent: false,
    external: true,
    value: (
      <>
        2108 Barton Hills Dr
        <br />
        Austin, TX 78704
      </>
    ),
    icon: (
      <svg
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <title>Address</title>
        <path
          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const quickLinks = [
  {
    title: 'PTA Reimbursement',
    to: '/reimbursement',
    description: 'Submit expense reimbursement requests to the PTA',
    icon: (
      <svg
        aria-hidden="true"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <title>Reimbursement</title>
        <path
          d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'AISD Parent Portal',
    url: 'https://portal.austinisd.org/',
    description: 'Access grades, attendance, and student information',
    icon: (
      <svg
        aria-hidden="true"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <title>Parent portal</title>
        <path
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'SchoolCafe / Lunch Menus',
    url: 'https://www.schoolcafe.com',
    description: 'View daily menus and manage lunch accounts',
    icon: (
      <svg
        aria-hidden="true"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <title>Lunch menu</title>
        <path
          d="M6.75 3v5.25a2.25 2.25 0 004.5 0V3m-2.25 5.25V21M15.75 3v18m0-18c-1.864 0-3.375 2.015-3.375 4.5s1.511 4.5 3.375 4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'Official School Website',
    url: 'https://bartonhills.austinschools.org',
    description: 'Barton Hills Elementary official AISD page',
    icon: (
      <svg
        aria-hidden="true"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <title>School building</title>
        <path
          d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'Austin ISD Homepage',
    url: 'https://www.austinisd.org',
    description: 'District news, policies, and resources',
    icon: (
      <svg
        aria-hidden="true"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <title>Academic / district</title>
        <path
          d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
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
              'repeating-linear-gradient(135deg, transparent, transparent 60px, #d4a843 60px, #d4a843 62px)',
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white">
            Parents
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Essential information and resources for Barton Hills Elementary families
          </p>
          <div className="mt-6 h-1 w-20 bg-spirit-gold rounded-full mx-auto" />
        </div>
      </section>

      {/* ── 2. Quick Links ───────────────────────────────────────────────── */}
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
            {quickLinks.map((link) => {
              const cardClass =
                'group rounded-lg bg-white p-6 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg'
              const inner = (
                <div className="flex items-start gap-4">
                  <div className="shrink-0 h-12 w-12 rounded-lg bg-eagle-blue/10 flex items-center justify-center text-eagle-blue group-hover:bg-eagle-blue group-hover:text-white transition-colors">
                    {link.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-charcoal group-hover:text-eagle-blue transition-colors">
                      {link.title}
                    </h3>
                    <p className="mt-1 text-sm text-charcoal/70">{link.description}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-heading font-bold text-eagle-blue group-hover:text-spirit-gold transition-colors">
                      {'to' in link ? 'Go' : 'Visit'}
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        viewBox="0 0 24 24"
                      >
                        <title>Go</title>
                        <path
                          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              );

              if ('to' in link && link.to) {
                return (
                  <Link className={cardClass} key={link.title} to={link.to}>
                    {inner}
                  </Link>
                );
              }
              return (
                <a
                  className={cardClass}
                  href={'url' in link ? link.url : '#'}
                  key={link.title}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {inner}
                  <span className="sr-only">(opens in new tab)</span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 3. School Overview Card ──────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-eagle-blue p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-white">
                School Hours
              </h2>
            </div>
            <div className="p-6 md:p-8">
              <table className="w-full">
                <caption className="sr-only">School hours</caption>
                <tbody className="divide-y divide-charcoal/10">
                  {hours.map((row) => (
                    <tr key={row.label}>
                      <th className="py-4 pr-4 text-left" scope="row">
                        <span className="font-heading font-bold text-charcoal">{row.label}</span>
                      </th>
                      <td className="py-4 text-right">
                        <span className="text-charcoal/70 font-medium">{row.time}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Contact Info ──────────────────────────────────────────────── */}
      <section className="bg-warm-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal">
              Contact Information
            </h2>
            <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full mx-auto" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactCards.map((card) => (
              <a
                className="group rounded-lg bg-white p-6 text-center shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                href={card.href}
                key={card.label}
                {...('external' in card && card.external
                  ? {rel: 'noopener noreferrer', target: '_blank'}
                  : {})}
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-eagle-blue/10 text-eagle-blue transition-colors group-hover:bg-eagle-blue group-hover:text-white">
                  {card.icon}
                </div>
                <p className="font-heading text-sm font-bold text-charcoal">{card.label}</p>
                <p
                  className={`mt-1 text-sm transition-colors ${
                    card.accent
                      ? 'text-eagle-blue group-hover:text-spirit-gold'
                      : 'text-charcoal/70 group-hover:text-eagle-blue'
                  }`}
                >
                  {card.value}
                </p>
                {'external' in card && card.external ? (
                  <span className="sr-only">(opens in new tab)</span>
                ) : null}
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
