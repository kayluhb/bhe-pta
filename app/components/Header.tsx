import { useState, useEffect, useRef } from "react";
import { NavLink, Link, useLocation } from "react-router";

const navLinks = [
  { to: "/about", label: "About" },
  { to: "/news", label: "News" },
  { to: "/events", label: "Events" },
  { to: "/get-involved", label: "Get Involved" },
  { to: "/programs", label: "Programs" },
  { to: "/parents", label: "Parents" },
  { to: "/sponsors", label: "Sponsors" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

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
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
            <span className="text-spirit-gold font-heading font-semibold text-sm">
              PTA
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "text-spirit-gold"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* CTA + Mobile Toggle */}
        <div className="flex items-center gap-3">
          <Link
            to="/get-involved"
            className="hidden sm:inline-block bg-spirit-gold text-night-blue font-heading font-bold text-sm px-5 py-2 rounded-full hover:bg-spirit-gold/90 transition-colors"
          >
            Join PTA
          </Link>

          {/* Hamburger Button */}
          <button
            ref={buttonRef}
            type="button"
            className="lg:hidden text-white p-2 rounded-md hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
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
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav aria-label="Mobile navigation" className="bg-eagle-blue border-t border-white/10 pb-4">
          <div className="max-w-7xl mx-auto px-4 pt-2 flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "text-spirit-gold bg-white/5"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/get-involved"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 bg-spirit-gold text-night-blue font-heading font-bold text-sm px-5 py-2 rounded-full text-center hover:bg-spirit-gold/90 transition-colors"
            >
              Join PTA
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
