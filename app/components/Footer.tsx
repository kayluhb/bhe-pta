import {Link, useLocation} from 'react-router';

import {EagleLogo} from '~/components/EagleLogo';
import {NewsletterSignup} from '~/components/NewsletterSignup';
import {Container} from '~/components/ui/Container';

const quickLinks = [
  {to: '/annual-fund', label: 'Annual Fund'},
  {to: '/reimbursement', label: 'Reimbursement'},
  {to: '/news', label: 'News'},
  {to: '/events', label: 'Events'},
  {to: '/get-involved', label: 'Get Involved'},
  {to: '/parents', label: 'Parents'},
  {to: '/archive', label: 'Archive'},
  {to: '/contact#newsletter-signup', label: 'Newsletter Signup'},
];

const columnLabel = 'text-[13px] font-bold uppercase tracking-[0.12em] text-bhe-gold';

const NEWSLETTER_HIDDEN_PATHS = ['/', '/contact', '/events'];

const socialLinks = [
  {
    href: 'https://www.facebook.com/groups/529482027464718/',
    label: 'Facebook group',
  },
  {
    href: 'https://www.instagram.com/bartonhillspta/',
    label: 'Instagram @bartonhillspta',
  },
  {
    href: 'https://www.instagram.com/bheeagles/',
    label: 'Instagram @bheeagles',
  },
];

export function Footer() {
  const {pathname} = useLocation();
  // Full signup already on home, contact and events — avoid a second Turnstile widget.
  const showNewsletter = !NEWSLETTER_HIDDEN_PATHS.includes(pathname);

  return (
    <footer className="relative overflow-hidden bg-bhe-green pt-[72px] text-[15px] text-bhe-on-green-muted">
      <EagleLogo className="pointer-events-none absolute -right-24 -bottom-24 h-auto w-[min(860px,160vw)] text-bhe-on-green opacity-[0.07]" />
      <Container className="relative z-10">
        <div className="flex flex-wrap gap-10 pb-12 lg:gap-12">
          <div className="min-w-[240px] flex-[1.2_1_280px]">
            <div className="flex items-start gap-3 text-bhe-on-green">
              <EagleLogo className="h-[60px] w-auto shrink-0" />
              <h3 className="font-display text-2xl font-extrabold leading-tight text-bhe-on-green">
                Barton Hills Elementary PTA
              </h3>
            </div>
            <p className="mt-4 max-w-sm leading-relaxed">
              Supporting students, teachers and families to build a thriving school community for
              every Eagle.
            </p>
          </div>

          <div className="min-w-[180px] flex-1">
            <h3 className={columnLabel}>Visit</h3>
            <address className="mt-3 not-italic leading-relaxed">
              <p>2108 Barton Hills Drive</p>
              <p>Austin, TX 78704</p>
              <p className="mt-2">School hours 7:40 a.m.–3:10 p.m.</p>
            </address>
          </div>

          <div className="min-w-[180px] flex-1">
            <h3 className={columnLabel}>Contact</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <a className="hover:text-bhe-gold" href="tel:+15124142013">
                  (512) 414-2013
                </a>
              </li>
              <li>Fax (512) 841-3849</li>
              <li>
                <a className="hover:text-bhe-gold" href="mailto:bhe@austinisd.org">
                  bhe@austinisd.org
                </a>
              </li>
            </ul>
          </div>

          <div className="min-w-[200px] flex-1">
            <h3 className={columnLabel}>Quick links</h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    className="inline-flex min-h-11 items-center py-2.5 hover:text-bhe-gold"
                    to={link.to}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-[180px] flex-1">
            <h3 className={columnLabel}>Follow</h3>
            <ul className="mt-3 space-y-2">
              {socialLinks.map((social) => (
                <li key={social.href}>
                  <a
                    className="hover:text-bhe-gold"
                    href={social.href}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {showNewsletter ? (
            <div className="min-w-[240px] flex-[1.1_1_260px]">
              <NewsletterSignup variant="compact" />
            </div>
          ) : null}
        </div>
      </Container>

      <div className="relative z-10 border-t border-bhe-green-line">
        <Container className="flex flex-col items-start justify-between gap-3 py-4 sm:flex-row sm:items-center">
          <p className="text-sm">
            © {new Date().getFullYear()} PTA Texas Congress Barton Hills Elementary
          </p>
          <div className="flex items-center gap-4">
            <Link className="hover:text-bhe-gold" to="/privacy">
              Privacy Policy
            </Link>
            <Link className="hover:text-bhe-gold" to="/terms">
              Terms of Use
            </Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}
