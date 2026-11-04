import {mergeParentMeta} from '~/lib/meta';
import type {Route} from './+types/terms';

export function meta({matches}: Route.MetaArgs) {
  return mergeParentMeta(matches, [
    {title: 'Terms of Use | Barton Hills Elementary PTA'},
    {
      name: 'description',
      content: 'Terms of use for the Barton Hills Elementary PTA website.',
    },
  ]);
}

export default function Terms() {
  return (
    <div>
      {/* ── Page Banner ────────────────────────────────────────────────── */}
      <section className="border-b border-bhe-border bg-bhe-paper py-12 md:py-16">
        <div className="mx-auto max-w-container px-4 md:px-6">
          <h1 className="font-display text-[36px] font-extrabold tracking-[-0.03em] text-bhe-ink md:text-[48px]">Terms of Use</h1>
          <p className="mt-4 max-w-2xl text-[17px] text-bhe-body">Guidelines for using the BHE PTA website</p>
        </div>
      </section>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <section className="bg-bhe-paper py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 prose prose-charcoal">
          <p className="text-sm text-bhe-ink/60">Last updated: February 21, 2026</p>

          <h2 className="text-2xl font-display font-bold text-bhe-ink mt-10">
            Acceptance of Terms
          </h2>
          <p className="text-bhe-ink/70 leading-relaxed mt-3">
            By accessing and using the Barton Hills Elementary PTA website (bheeagles.com), you
            agree to these Terms of Use. If you do not agree, please do not use the site.
          </p>

          <h2 className="text-2xl font-display font-bold text-bhe-ink mt-10">
            Use of the Website
          </h2>
          <p className="text-bhe-ink/70 leading-relaxed mt-3">
            This website is provided by the Barton Hills Elementary PTA for informational purposes
            to support our school community. You agree to use it only for lawful purposes related to
            school and PTA activities.
          </p>

          <h2 className="text-2xl font-display font-bold text-bhe-ink mt-10">
            Reimbursement Submissions
          </h2>
          <p className="text-bhe-ink/70 leading-relaxed mt-3">
            The reimbursement form is provided for PTA members to submit expense reimbursement
            requests. By submitting a reimbursement request, you confirm that:
          </p>
          <ul className="mt-3 space-y-2 text-bhe-ink/70">
            <li>The information you provide is accurate and truthful</li>
            <li>The expenses were incurred for legitimate PTA purposes</li>
            <li>Receipts and supporting documents are genuine and unaltered</li>
          </ul>
          <p className="text-bhe-ink/70 leading-relaxed mt-3">
            The PTA reserves the right to approve or deny any reimbursement request at its
            discretion.
          </p>

          <h2 className="text-2xl font-display font-bold text-bhe-ink mt-10">
            Intellectual Property
          </h2>
          <p className="text-bhe-ink/70 leading-relaxed mt-3">
            Content on this website, including text, graphics, and logos, is the property of the
            Barton Hills Elementary PTA or its content providers. You may not reproduce, distribute,
            or create derivative works from this content without prior written permission.
          </p>

          <h2 className="text-2xl font-display font-bold text-bhe-ink mt-10">Third-Party Links</h2>
          <p className="text-bhe-ink/70 leading-relaxed mt-3">
            Our website may contain links to external websites (e.g., Cheddar Up, Mailchimp, Austin
            ISD). We are not responsible for the content or privacy practices of those sites.
            Accessing third-party links is at your own risk.
          </p>

          <h2 className="text-2xl font-display font-bold text-bhe-ink mt-10">Disclaimer</h2>
          <p className="text-bhe-ink/70 leading-relaxed mt-3">
            This website is provided "as is" without warranties of any kind. The BHE PTA makes no
            guarantees about the accuracy, completeness, or reliability of any information on this
            site. Calendar events, newsletter content, and other information are provided for
            convenience and may not always be up to date.
          </p>

          <h2 className="text-2xl font-display font-bold text-bhe-ink mt-10">
            Limitation of Liability
          </h2>
          <p className="text-bhe-ink/70 leading-relaxed mt-3">
            The Barton Hills Elementary PTA and its officers, volunteers, and affiliates shall not
            be liable for any damages arising from your use of this website.
          </p>

          <h2 className="text-2xl font-display font-bold text-bhe-ink mt-10">
            Changes to These Terms
          </h2>
          <p className="text-bhe-ink/70 leading-relaxed mt-3">
            We may update these Terms of Use at any time. Continued use of the website after changes
            constitutes acceptance of the revised terms.
          </p>

          <h2 className="text-2xl font-display font-bold text-bhe-ink mt-10">Contact Us</h2>
          <p className="text-bhe-ink/70 leading-relaxed mt-3">
            If you have questions about these Terms of Use, please contact us at{' '}
            <a
              className="text-bhe-green hover:text-bhe-gold transition-colors"
              href="mailto:pta@bheeagles.com"
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
