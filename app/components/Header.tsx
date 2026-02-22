import {useCallback, useEffect, useRef, useState} from 'react';
import {Link, NavLink, useLocation} from 'react-router';

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
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img
            src="/logo.svg"
            alt="Barton Hills Elementary PTA Eagle Logo"
            className="h-12 w-auto invert"
          />
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-white font-heading font-bold text-lg">
              Barton Hills Elementary
            </span>
            <span className="text-spirit-gold font-heading font-semibold text-sm">PTA</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({isActive}) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'text-spirit-gold' : 'text-white/80 hover:text-white hover:bg-white/10'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* CTA + Mobile Toggle */}
        <div className="flex items-center gap-3">
          <a
            href="https://my.cheddarup.com/c/bhe-pta-annual-fund-drive-2025-26"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-block bg-spirit-gold text-night-blue font-heading font-bold text-sm px-5 py-2 rounded-full hover:bg-spirit-gold/90 transition-colors"
          >
            Join PTA<span className="sr-only"> (opens in new tab)</span>
          </a>

          {/* Hamburger Button */}
          <button
            ref={buttonRef}
            type="button"
            className="lg:hidden text-white p-2 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        ref={menuRef}
        id="mobile-menu"
        aria-hidden={!mobileMenuOpen}
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav aria-label="Mobile navigation" className="bg-eagle-blue border-t border-white/10 pb-4">
          <div className="max-w-7xl mx-auto px-4 pt-2 flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                tabIndex={mobileMenuOpen ? 0 : -1}
                className={({isActive}) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-spirit-gold bg-white/5'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <a
              href="https://my.cheddarup.com/c/bhe-pta-annual-fund-drive-2025-26"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              tabIndex={mobileMenuOpen ? 0 : -1}
              className="mt-2 bg-spirit-gold text-night-blue font-heading font-bold text-sm px-5 py-2 rounded-full text-center hover:bg-spirit-gold/90 transition-colors block"
            >
              Join PTA<span className="sr-only"> (opens in new tab)</span>
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
