import {useCallback, useEffect, useRef, useState} from 'react';
import {Link, NavLink, useLocation} from 'react-router';

import {HeaderLogo} from '~/components/HeaderLogo';
import {Button} from '~/components/ui/Button';
import {Container} from '~/components/ui/Container';
import {annualFundPath} from '~/data/annual-fund-campaign';

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
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  const closeMenu = useCallback(() => {
    setMobileMenuOpen(false);
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    void location.pathname;
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (headerRef.current?.contains(event.target as Node) === false) {
        closeMenu();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen, closeMenu]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeMenu();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = headerRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable || focusable.length === 0) return;

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

  useEffect(() => {
    if (mobileMenuOpen && menuRef.current) {
      const firstLink = menuRef.current.querySelector<HTMLElement>('a[href]');
      firstLink?.focus();
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-bhe-border bg-bhe-paper" ref={headerRef}>
      <Container className="flex items-center justify-between py-[18px]">
        <Link aria-label="Barton Hills Elementary PTA home" className="shrink-0" to="/">
          <span className="hidden md:inline">
            <HeaderLogo />
          </span>
          <span className="md:hidden">
            <HeaderLogo compact />
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-0.5 md:flex">
          {navLinks.map((link) => (
            <NavLink
              className={({isActive}) =>
                [
                  'px-3 py-2.5 text-base font-semibold text-bhe-ink transition-colors hover:text-bhe-green-2',
                  isActive ? 'font-bold underline decoration-2 underline-offset-6' : '',
                ].join(' ')
              }
              key={link.to}
              to={link.to}
            >
              {link.label}
            </NavLink>
          ))}
          <Button className="ml-3" size="md" to={annualFundPath} variant="accent">
            Give
          </Button>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Button size="md" to={annualFundPath} variant="accent">
            Give
          </Button>
          <button
            aria-controls="mobile-menu"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-bhe-green hover:bg-bhe-tint-green"
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
      </Container>

      <div
        aria-hidden={!mobileMenuOpen}
        className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}
        id="mobile-menu"
        ref={menuRef}
      >
        <nav
          aria-label="Mobile navigation"
          className="flex min-h-[calc(100dvh-5.5rem)] flex-col border-t border-bhe-border bg-bhe-paper px-4 pb-8 pt-2"
        >
          {navLinks.map((link) => (
            <NavLink
              className={({isActive}) =>
                [
                  'flex min-h-[52px] items-center text-xl font-bold text-bhe-ink',
                  isActive ? 'underline decoration-2 underline-offset-4' : '',
                ].join(' ')
              }
              key={link.to}
              onClick={() => setMobileMenuOpen(false)}
              tabIndex={mobileMenuOpen ? 0 : -1}
              to={link.to}
            >
              {link.label}
            </NavLink>
          ))}
          <Button
            className="mt-auto w-full"
            onClick={() => setMobileMenuOpen(false)}
            size="lg"
            tabIndex={mobileMenuOpen ? 0 : -1}
            to={annualFundPath}
            variant="accent"
          >
            Give
          </Button>
        </nav>
      </div>
    </header>
  );
}
