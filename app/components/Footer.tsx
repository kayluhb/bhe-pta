import {Link} from 'react-router';

const quickLinks = [
  {to: '/reimbursement', label: 'Reimbursement'},
  {to: '/news', label: 'News'},
  {to: '/events', label: 'Events'},
  {to: '/get-involved', label: 'Get Involved'},
  {to: '/parents', label: 'Parents'},
  {to: '/archive', label: 'Archive'},
];

export function Footer() {
  return (
    <footer className="bg-night-blue text-white/90">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand Column */}
          <div>
            <h3 className="text-white font-heading font-bold text-lg">
              Barton Hills Elementary PTA
            </h3>
            <p className="mt-3 text-sm leading-relaxed">
              Supporting students, teachers, and families to build a thriving school community for
              every Eagle.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a
                className="inline-flex items-center justify-center w-11 h-11 rounded-full text-white/80 hover:text-spirit-gold transition-colors"
                href="https://www.facebook.com/groups/529482027464718/"
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="sr-only">Visit our Facebook page (opens in new tab)</span>
                <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                className="inline-flex items-center justify-center w-11 h-11 rounded-full text-white/80 hover:text-spirit-gold transition-colors"
                href="https://www.instagram.com/bartonhillspta/"
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="sr-only">Visit PTA Instagram (opens in new tab)</span>
                <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a
                className="inline-flex items-center justify-center w-11 h-11 rounded-full text-white/80 hover:text-spirit-gold transition-colors"
                href="https://www.instagram.com/bheeagles/"
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="sr-only">Visit BHE school Instagram (opens in new tab)</span>
                <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="text-white font-heading font-bold text-lg">Quick Links</h3>
            <ul className="mt-3 space-y-2">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link className="text-sm hover:text-spirit-gold transition-colors" to={link.to}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-white font-heading font-bold text-lg">Contact Us</h3>
            <address className="mt-3 not-italic text-sm space-y-2">
              <p>2108 Barton Hills Drive</p>
              <p>Austin, TX 78704</p>
              <p className="mt-3">
                <a className="hover:text-spirit-gold transition-colors" href="tel:+15124142013">
                  (512) 414-2013
                </a>
              </p>
              <p>
                Fax: <span className="text-white/80">(512) 841-3849</span>
              </p>
              <p>
                <a
                  className="hover:text-spirit-gold transition-colors"
                  href="mailto:bhe@austinisd.org"
                >
                  bhe@austinisd.org
                </a>
              </p>
              <p className="mt-3 text-white/80">School Hours: 7:40 a.m. – 3:10 p.m.</p>
            </address>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-white/70">
            &copy; {new Date().getFullYear()} Barton Hills Elementary PTA. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              className="text-xs text-white/70 hover:text-spirit-gold transition-colors"
              to="/privacy"
            >
              Privacy Policy
            </Link>
            <Link
              className="text-xs text-white/70 hover:text-spirit-gold transition-colors"
              to="/terms"
            >
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
