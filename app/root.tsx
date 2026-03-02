import {useCallback, useEffect, useState} from 'react';
import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';

import type {Route} from './+types/root';
import {Footer} from './components/Footer';
import {Header} from './components/Header';
import {useDiscoMode} from './hooks/useDiscoMode';
import './app.css';

export function meta() {
  return [
    {title: 'Barton Hills Elementary PTA'},
    {
      name: 'description',
      content:
        'Barton Hills Elementary PTA - Supporting our school community through parent involvement, fundraising, and advocacy since 1964.',
    },
    {property: 'og:title', content: 'Barton Hills Elementary PTA'},
    {property: 'og:description', content: 'Supporting our school community since 1964'},
    {property: 'og:type', content: 'website'},
    {property: 'og:image', content: 'https://bheeagles.com/og-image.png'},
    {property: 'og:image:width', content: '850'},
    {property: 'og:image:height', content: '850'},
    {property: 'og:image:alt', content: 'Barton Hills Elementary School eagle logo'},
    {name: 'twitter:card', content: 'summary'},
    {name: 'twitter:image', content: 'https://bheeagles.com/og-image.png'},
    {name: 'apple-mobile-web-app-title', content: 'BHE PTA'},
  ];
}

export const links: Route.LinksFunction = () => [
  {rel: 'icon', type: 'image/png', href: '/favicon-96x96.png', sizes: '96x96'},
  {rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg'},
  {rel: 'shortcut icon', href: '/favicon.ico'},
  {rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png'},
  {rel: 'manifest', href: '/site.webmanifest'},
  {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Montserrat:wght@400;500;600;700&display=swap',
  },
];

export function Layout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <Meta />
        <Links />
      </head>
      <body className="font-body bg-warm-white text-charcoal">
        <a
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[100] focus:bg-spirit-gold focus:text-night-blue focus:px-4 focus:py-2 focus:font-bold"
          href="#main-content"
        >
          Skip to main content
        </a>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function DJBeckettBadge() {
  return (
    <div className="disco-badge fixed top-20 right-4 z-50 pointer-events-none bg-spirit-gold text-night-blue font-heading font-bold px-5 py-3 rounded-xl shadow-lg text-sm">
      <img alt="" className="w-16 mx-auto mb-2" src="/disco.png" />
      <span className="block text-center">🎵 Now Playing 🎵</span>
      <span className="block text-center text-lg">DJ Beckett</span>
    </div>
  );
}

export default function App() {
  const {isDiscoMode} = useDiscoMode();

  return (
    <div className={`min-h-screen flex flex-col${isDiscoMode ? ' disco-active' : ''}`}>
      <Header />
      <main className="flex-1" id="main-content">
        <Outlet />
      </main>
      <Footer />
      {isDiscoMode && <DJBeckettBadge />}
    </div>
  );
}

function EagleEyes() {
  const [leftPupil, setLeftPupil] = useState({x: 0, y: 0});
  const [rightPupil, setRightPupil] = useState({x: 0, y: 0});

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const calcPupil = (eyeId: string, maxR: number) => {
      const eye = document.getElementById(eyeId);
      if (!eye) return {x: 0, y: 0};
      const rect = eye.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const angle = Math.atan2(dy, dx);
      const dist = Math.min(Math.hypot(dx, dy) / 120, 1);
      return {x: dist * Math.cos(angle) * maxR, y: dist * Math.sin(angle) * maxR};
    };
    setLeftPupil(calcPupil('eagle-left-eye', 4));
    setRightPupil(calcPupil('eagle-right-eye', 4));
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  const stroke = '#1a6b3a';
  const gold = '#d4a843';
  const white = '#faf8f5';

  return (
    <div aria-hidden="true" className="select-none">
      <svg
        className="mx-auto h-48 w-48 sm:h-56 sm:w-56 md:h-64 md:w-64"
        fill="none"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Feathered neck / chest */}
        <path
          d="M100 200 C60 200, 35 175, 38 145 C40 125, 55 115, 65 110
             L100 105 L135 110
             C145 115, 160 125, 162 145
             C165 175, 140 200, 100 200Z"
          fill={stroke}
          opacity={0.12}
          stroke={stroke}
          strokeWidth={2.5}
        />
        {/* Neck feather texture lines */}
        <path
          d="M72 130 Q100 145, 128 130"
          fill="none"
          opacity={0.4}
          stroke={stroke}
          strokeWidth={1.5}
        />
        <path
          d="M68 145 Q100 162, 132 145"
          fill="none"
          opacity={0.3}
          stroke={stroke}
          strokeWidth={1.5}
        />
        <path
          d="M65 160 Q100 178, 135 160"
          fill="none"
          opacity={0.25}
          stroke={stroke}
          strokeWidth={1.5}
        />
        <path
          d="M64 175 Q100 192, 136 175"
          fill="none"
          opacity={0.2}
          stroke={stroke}
          strokeWidth={1.5}
        />

        {/* Head shape — broad at brow, tapering down */}
        <path
          d="M100 18
             C68 18, 38 40, 36 72
             C35 88, 42 100, 55 108
             L100 115
             L145 108
             C158 100, 165 88, 164 72
             C162 40, 132 18, 100 18Z"
          fill={white}
          stroke={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
        />

        {/* Brow ridge — left */}
        <path
          d="M46 62 C52 48, 68 42, 82 50"
          fill="none"
          stroke={stroke}
          strokeLinecap="round"
          strokeWidth={3.5}
        />
        {/* Brow ridge — right */}
        <path
          d="M154 62 C148 48, 132 42, 118 50"
          fill="none"
          stroke={stroke}
          strokeLinecap="round"
          strokeWidth={3.5}
        />

        {/* Eye sockets */}
        <ellipse cx={75} cy={68} fill={white} rx={16} ry={14} stroke={stroke} strokeWidth={2.5} />
        <ellipse cx={125} cy={68} fill={white} rx={16} ry={14} stroke={stroke} strokeWidth={2.5} />

        {/* Irises */}
        <circle cx={75} cy={68} fill={gold} opacity={0.35} r={10} />
        <circle cx={125} cy={68} fill={gold} opacity={0.35} r={10} />

        {/* Pupils — these track the mouse */}
        <circle
          cx={75 + leftPupil.x}
          cy={68 + leftPupil.y}
          fill={stroke}
          id="eagle-left-eye"
          r={5}
        />
        <circle
          cx={125 + rightPupil.x}
          cy={68 + rightPupil.y}
          fill={stroke}
          id="eagle-right-eye"
          r={5}
        />

        {/* Eye shine highlights */}
        <circle cx={72 + leftPupil.x * 0.5} cy={65 + leftPupil.y * 0.5} fill={white} r={2} />
        <circle cx={122 + rightPupil.x * 0.5} cy={65 + rightPupil.y * 0.5} fill={white} r={2} />

        {/* Beak — sharp hooked shape */}
        <path
          d="M93 80 L100 78 L107 80
             L108 88 L104 96 L100 102
             L96 96 L92 88 Z"
          fill={gold}
          stroke={stroke}
          strokeLinejoin="round"
          strokeWidth={2}
        />
        {/* Beak hook / nostril detail */}
        <path
          d="M96 88 L100 92 L104 88"
          fill="none"
          stroke={stroke}
          strokeLinecap="round"
          strokeWidth={1.5}
        />
        {/* Beak center line */}
        <path d="M100 80 L100 96" fill="none" opacity={0.3} stroke={stroke} strokeWidth={1} />

        {/* Head tuft feathers */}
        <path
          d="M88 22 Q92 8, 100 14"
          fill="none"
          stroke={stroke}
          strokeLinecap="round"
          strokeWidth={2}
        />
        <path
          d="M100 20 Q100 6, 105 12"
          fill="none"
          stroke={stroke}
          strokeLinecap="round"
          strokeWidth={2}
        />
        <path
          d="M112 22 Q108 8, 100 14"
          fill="none"
          stroke={stroke}
          strokeLinecap="round"
          strokeWidth={2}
        />
      </svg>
    </div>
  );
}

export function ErrorBoundary({error}: Route.ErrorBoundaryProps) {
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  if (!is404) {
    let details = 'An unexpected error occurred.';
    let stack: string | undefined;
    if (isRouteErrorResponse(error)) {
      details = error.statusText || details;
    } else if (import.meta.env.DEV && error && error instanceof Error) {
      details = error.message;
      stack = error.stack;
    }
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-16 p-4 container mx-auto" id="main-content">
          <h1 className="text-3xl font-heading font-bold text-eagle-blue">Error</h1>
          <p className="mt-2 text-charcoal">{details}</p>
          {stack && (
            <pre className="w-full p-4 overflow-x-auto mt-4">
              <code>{stack}</code>
            </pre>
          )}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-16 px-4" id="main-content">
        <div className="text-center max-w-lg">
          <EagleEyes />
          <h1 className="text-6xl font-heading font-bold text-eagle-blue mt-6">404</h1>
          <p className="text-xl text-charcoal/70 mt-3 font-body">
            This eagle has searched far and wide, but that page doesn't exist.
          </p>
          <Link
            className="inline-block mt-8 bg-eagle-blue text-white font-heading font-bold text-sm px-6 py-3 rounded-full hover:bg-eagle-blue/90 transition-colors"
            to="/"
          >
            Fly Back Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
