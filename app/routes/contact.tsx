import {NewsletterSignup} from '~/components/NewsletterSignup';
import type {Route} from './+types/contact';

export function meta({}: Route.MetaArgs) {
  return [
    {title: 'Contact | Barton Hills Elementary PTA'},
    {
      name: 'description',
      content:
        'Get in touch with the Barton Hills Elementary PTA. Subscribe to newsletters and follow us on social media.',
    },
  ];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Contact() {
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
            Contact Us
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Stay connected with Barton Hills Elementary PTA
          </p>
          <div className="mt-6 h-1 w-20 bg-spirit-gold rounded-full mx-auto" />
        </div>
      </section>

      {/* ── 2. Newsletter Signup ─────────────────────────────────────────── */}
      <NewsletterSignup />

      {/* ── 3. Social Media ──────────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal">Follow Us</h2>
            <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full mx-auto" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Facebook */}
            <a
              className="group flex items-center gap-5 bg-warm-white rounded-lg shadow-md p-6 border-b-4 border-eagle-blue hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              href="https://www.facebook.com/bartonhillspta/"
              rel="noopener noreferrer"
              target="_blank"
            >
              <div className="shrink-0 h-14 w-14 rounded-full bg-eagle-blue flex items-center justify-center text-white">
                <svg aria-hidden="true" className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-charcoal group-hover:text-eagle-blue transition-colors">
                  Facebook
                </h3>
                <p className="text-sm text-charcoal/70">@bartonhillspta</p>
              </div>
              <svg
                aria-hidden="true"
                className="h-5 w-5 text-charcoal/30 group-hover:text-eagle-blue transition-colors ml-auto shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="sr-only">(opens in new tab)</span>
            </a>

            {/* Instagram */}
            <a
              className="group flex items-center gap-5 bg-warm-white rounded-lg shadow-md p-6 border-b-4 border-spirit-gold hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              href="https://www.instagram.com/bartonhillspta/"
              rel="noopener noreferrer"
              target="_blank"
            >
              <div className="shrink-0 h-14 w-14 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center text-white">
                <svg aria-hidden="true" className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-charcoal group-hover:text-eagle-blue transition-colors">
                  Instagram
                </h3>
                <p className="text-sm text-charcoal/70">@bartonhillspta (PTA)</p>
              </div>
              <svg
                aria-hidden="true"
                className="h-5 w-5 text-charcoal/30 group-hover:text-eagle-blue transition-colors ml-auto shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="sr-only">(opens in new tab)</span>
            </a>

            {/* BHE School Instagram */}
            <a
              className="group flex items-center gap-5 bg-warm-white rounded-lg shadow-md p-6 border-b-4 border-eagle-blue hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              href="https://www.instagram.com/bheeagles/"
              rel="noopener noreferrer"
              target="_blank"
            >
              <div className="shrink-0 h-14 w-14 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center text-white">
                <svg aria-hidden="true" className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-charcoal group-hover:text-eagle-blue transition-colors">
                  BHE on Instagram
                </h3>
                <p className="text-sm text-charcoal/70">@bheeagles (School)</p>
              </div>
              <svg
                aria-hidden="true"
                className="h-5 w-5 text-charcoal/30 group-hover:text-eagle-blue transition-colors ml-auto shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="sr-only">(opens in new tab)</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── 4. Contact Details ───────────────────────────────────────────── */}
      <section className="bg-warm-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal">
              Contact Details
            </h2>
            <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full mx-auto" />
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-charcoal/10">
              {/* Left: Address & Hours */}
              <div className="p-8 md:p-10">
                <h3 className="font-heading font-bold text-lg text-charcoal mb-6">
                  School Information
                </h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 h-10 w-10 rounded-lg bg-eagle-blue/10 flex items-center justify-center text-eagle-blue">
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        viewBox="0 0 24 24"
                      >
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
                    </div>
                    <div>
                      <p className="font-heading font-bold text-charcoal">Address</p>
                      <p className="text-charcoal/70 mt-1">
                        2108 Barton Hills Drive
                        <br />
                        Austin, TX 78704
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="shrink-0 h-10 w-10 rounded-lg bg-eagle-blue/10 flex items-center justify-center text-eagle-blue">
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-heading font-bold text-charcoal">School Hours</p>
                      <p className="text-charcoal/70 mt-1">7:40 a.m. - 3:10 p.m.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Phone, Fax, Email */}
              <div className="p-8 md:p-10">
                <h3 className="font-heading font-bold text-lg text-charcoal mb-6">Get in Touch</h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 h-10 w-10 rounded-lg bg-eagle-blue/10 flex items-center justify-center text-eagle-blue">
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-heading font-bold text-charcoal">Phone</p>
                      <a
                        className="text-eagle-blue hover:text-spirit-gold transition-colors mt-1 inline-block"
                        href="tel:+15124142013"
                      >
                        (512) 414-2013
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="shrink-0 h-10 w-10 rounded-lg bg-eagle-blue/10 flex items-center justify-center text-eagle-blue">
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m0 0a48.159 48.159 0 0110.5 0m-10.5 0V3.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-heading font-bold text-charcoal">Fax</p>
                      <p className="text-charcoal/70 mt-1">(512) 841-3849</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="shrink-0 h-10 w-10 rounded-lg bg-eagle-blue/10 flex items-center justify-center text-eagle-blue">
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-heading font-bold text-charcoal">Email</p>
                      <a
                        className="text-eagle-blue hover:text-spirit-gold transition-colors mt-1 inline-block"
                        href="mailto:bhe@austinisd.org"
                      >
                        bhe@austinisd.org
                      </a>
                      <br />
                      <a
                        className="text-eagle-blue hover:text-spirit-gold transition-colors inline-block"
                        href="mailto:pta@bheeagles.com"
                      >
                        pta@bheeagles.com
                      </a>
                      <span className="text-charcoal/70 text-sm ml-1">(PTA)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
