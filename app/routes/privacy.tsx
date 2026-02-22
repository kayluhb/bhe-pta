import type { Route } from "./+types/privacy";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Privacy Policy | Barton Hills Elementary PTA" },
    {
      name: "description",
      content:
        "Privacy policy for the Barton Hills Elementary PTA website.",
    },
  ];
}

export default function Privacy() {
  return (
    <div>
      {/* ── Page Banner ────────────────────────────────────────────────── */}
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
            Privacy Policy
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            How we collect, use, and protect your information
          </p>
          <div className="mt-6 h-1 w-20 bg-spirit-gold rounded-full mx-auto" />
        </div>
      </section>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <section className="bg-warm-white py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 prose prose-charcoal">
          <p className="text-sm text-charcoal/60">
            Last updated: February 21, 2026
          </p>

          <h2 className="text-2xl font-heading font-bold text-charcoal mt-10">
            Introduction
          </h2>
          <p className="text-charcoal/70 leading-relaxed mt-3">
            The Barton Hills Elementary Parent Teacher Association ("BHE PTA,"
            "we," "us," or "our") operates the bheeagles.com website. This
            Privacy Policy explains how we collect, use, and safeguard your
            information when you visit our website.
          </p>

          <h2 className="text-2xl font-heading font-bold text-charcoal mt-10">
            Information We Collect
          </h2>
          <p className="text-charcoal/70 leading-relaxed mt-3">
            We may collect the following types of information:
          </p>
          <ul className="mt-3 space-y-2 text-charcoal/70">
            <li>
              <strong className="text-charcoal">Email address</strong> — when
              you subscribe to our newsletter via Mailchimp.
            </li>
            <li>
              <strong className="text-charcoal">Reimbursement details</strong>{" "}
              — names, descriptions, amounts, and receipt images submitted
              through our reimbursement form. This data is stored securely and
              used solely for processing PTA reimbursements.
            </li>
            <li>
              <strong className="text-charcoal">Usage data</strong> — we may
              use privacy-respecting analytics to understand how visitors use
              our site. We do not use tracking cookies or sell data to third
              parties.
            </li>
          </ul>

          <h2 className="text-2xl font-heading font-bold text-charcoal mt-10">
            How We Use Your Information
          </h2>
          <ul className="mt-3 space-y-2 text-charcoal/70">
            <li>To send PTA newsletters and school-related updates</li>
            <li>To process and track reimbursement requests</li>
            <li>To improve and maintain our website</li>
          </ul>

          <h2 className="text-2xl font-heading font-bold text-charcoal mt-10">
            Third-Party Services
          </h2>
          <p className="text-charcoal/70 leading-relaxed mt-3">
            We use the following third-party services:
          </p>
          <ul className="mt-3 space-y-2 text-charcoal/70">
            <li>
              <strong className="text-charcoal">Mailchimp</strong> — for
              newsletter distribution. Your email address is shared with
              Mailchimp when you subscribe. See{" "}
              <a
                href="https://mailchimp.com/legal/privacy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-eagle-blue hover:text-spirit-gold transition-colors"
              >
                Mailchimp's Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong className="text-charcoal">Cloudflare</strong> — for
              website hosting and security. See{" "}
              <a
                href="https://www.cloudflare.com/privacypolicy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-eagle-blue hover:text-spirit-gold transition-colors"
              >
                Cloudflare's Privacy Policy
              </a>
              .
            </li>
          </ul>

          <h2 className="text-2xl font-heading font-bold text-charcoal mt-10">
            Data Security
          </h2>
          <p className="text-charcoal/70 leading-relaxed mt-3">
            We take reasonable measures to protect the information you provide.
            Reimbursement data and uploaded files are stored using
            industry-standard encryption and access controls. However, no method
            of transmission over the Internet is 100% secure.
          </p>

          <h2 className="text-2xl font-heading font-bold text-charcoal mt-10">
            Children's Privacy
          </h2>
          <p className="text-charcoal/70 leading-relaxed mt-3">
            Our website is intended for parents, guardians, and community
            members. We do not knowingly collect personal information from
            children under 13. If you believe a child has provided us with
            personal information, please contact us so we can remove it.
          </p>

          <h2 className="text-2xl font-heading font-bold text-charcoal mt-10">
            Your Rights
          </h2>
          <p className="text-charcoal/70 leading-relaxed mt-3">
            You may unsubscribe from our newsletter at any time using the link
            in any email. To request deletion of your reimbursement data or
            other personal information, please contact us at{" "}
            <a
              href="mailto:pta@bheeagles.com"
              className="text-eagle-blue hover:text-spirit-gold transition-colors"
            >
              pta@bheeagles.com
            </a>
            .
          </p>

          <h2 className="text-2xl font-heading font-bold text-charcoal mt-10">
            Changes to This Policy
          </h2>
          <p className="text-charcoal/70 leading-relaxed mt-3">
            We may update this Privacy Policy from time to time. Changes will be
            posted on this page with an updated revision date.
          </p>

          <h2 className="text-2xl font-heading font-bold text-charcoal mt-10">
            Contact Us
          </h2>
          <p className="text-charcoal/70 leading-relaxed mt-3">
            If you have questions about this Privacy Policy, please contact us
            at{" "}
            <a
              href="mailto:pta@bheeagles.com"
              className="text-eagle-blue hover:text-spirit-gold transition-colors"
            >
              pta@bheeagles.com
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
