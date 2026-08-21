import {useCallback, useEffect, useRef, useState} from 'react';
import {Link, NavLink, useLocation} from 'react-router';

import {HeaderLogo} from '~/components/HeaderLogo';
import {annualFundGiveUrl} from '~/data/annual-fund-campaign';

const navLinks = [
  {to: '/about', label: 'About'},
  {to: '/news', label: 'News'},
  {to: '/events', label: 'Events'},
  {to: '/programs', label: 'Programs'},
  {to: '/parents', label: 'Parents'},
  {to: '/get-involved', label: 'Get Involved'},
  {to: '/contact', label: 'Contact'},
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  const closeMenu = useCallback(() => {
    setMobileMenuOpen(false);
    buttonRef.current?.focus();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    void location.pathname;
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!mobileMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen, closeMenu]);

  // Escape key handler and focus trap
  useEffect(() => {
    if (!mobileMenuOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeMenu();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && menuRef.current) {
        const focusable = menuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen, closeMenu]);

  // Focus first menu item when menu opens
  useEffect(() => {
    if (mobileMenuOpen && menuRef.current) {
      const firstLink = menuRef.current.querySelector<HTMLElement>('a[href]');
      firstLink?.focus();
    }
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-eagle-blue shadow-lg">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo + Site Name */}
        <Link aria-label="Barton Hills Elementary PTA home" className="flex items-center shrink-0" to="/">
          <HeaderLogo />
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              className={({isActive}) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'text-spirit-gold' : 'text-white/80 hover:text-white hover:bg-white/10'
                }`
              }
              key={link.to}
              to={link.to}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* CTA + Mobile Toggle */}
        <div className="flex items-center gap-3">
          <a
            className="hidden sm:inline-block bg-spirit-gold text-night-blue font-heading font-bold text-sm px-5 py-2 rounded-full hover:bg-spirit-gold/90 transition-colors"
            href={annualFundGiveUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Join PTA<span className="sr-only"> (opens in new tab)</span>
          </a>

          {/* Hamburger Button */}
          <button
            aria-controls="mobile-menu"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="lg:hidden text-white p-2 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            ref={buttonRef}
            type="button"
          >
            {mobileMenuOpen ? (
              <svg
                aria-hidden="true"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        aria-hidden={!mobileMenuOpen}
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
        id="mobile-menu"
        ref={menuRef}
      >
        <nav aria-label="Mobile navigation" className="bg-eagle-blue border-t border-white/10 pb-4">
          <div className="max-w-7xl mx-auto px-4 pt-2 flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                className={({isActive}) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-spirit-gold bg-white/5'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`
                }
                key={link.to}
                onClick={() => setMobileMenuOpen(false)}
                tabIndex={mobileMenuOpen ? 0 : -1}
                to={link.to}
              >
                {link.label}
              </NavLink>
            ))}
            <a
              className="mt-2 bg-spirit-gold text-night-blue font-heading font-bold text-sm px-5 py-2 rounded-full text-center hover:bg-spirit-gold/90 transition-colors block"
              href={annualFundGiveUrl}
              onClick={() => setMobileMenuOpen(false)}
              rel="noopener noreferrer"
              tabIndex={mobileMenuOpen ? 0 : -1}
              target="_blank"
            >
              Join PTA<span className="sr-only"> (opens in new tab)</span>
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
