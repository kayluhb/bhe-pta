import { useState, useEffect, useCallback } from "react";
import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import "./app.css";

export function meta() {
  return [
    { title: "Barton Hills Elementary PTA" },
    { name: "description", content: "Barton Hills Elementary PTA - Supporting our school community through parent involvement, fundraising, and advocacy since 1964." },
    { property: "og:title", content: "Barton Hills Elementary PTA" },
    { property: "og:description", content: "Supporting our school community since 1964" },
    { property: "og:type", content: "website" },
    { name: "apple-mobile-web-app-title", content: "BHE PTA" },
  ];
}

export const links: Route.LinksFunction = () => [
  { rel: "icon", type: "image/png", href: "/favicon-96x96.png", sizes: "96x96" },
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "shortcut icon", href: "/favicon.ico" },
  { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
  { rel: "manifest", href: "/site.webmanifest" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Montserrat:wght@400;500;600;700&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="font-body bg-warm-white text-charcoal">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[100] focus:bg-spirit-gold focus:text-night-blue focus:px-4 focus:py-2 focus:font-bold"
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

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function EagleEyes() {
  const [leftPupil, setLeftPupil] = useState({ x: 0, y: 0 });
  const [rightPupil, setRightPupil] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const calcPupil = (eyeId: string) => {
      const eye = document.getElementById(eyeId);
      if (!eye) return { x: 0, y: 0 };
      const rect = eye.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const angle = Math.atan2(dy, dx);
      const dist = Math.min(Math.hypot(dx, dy) / 80, 1);
      return { x: dist * Math.cos(angle) * 3, y: dist * Math.sin(angle) * 2 };
    };
    setLeftPupil(calcPupil("eagle-left-eye"));
    setRightPupil(calcPupil("eagle-right-eye"));
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  const pupilChar = "\u25CF";

  // prettier-ignore
  const lines = [
    "                    ___",
    "                _,-'   `-._",
    "              ,'             `.",
    "            ,'    __     __    `.",
    "           /    ,[  ]   [  ],    \\",
    "          /     `--'     `--'     \\",
    "         |    ___           ___    |",
    "         |   /   \\  ,\",   /   \\   |",
    "          \\  \\___/ / | \\  \\___/  /",
    "           `.     /  |  \\      ,'",
    "        ____`-._ \\  |  / _,-'____",
    "      ,'    `-._`-._|_,-'_,-'    `.",
    "    ,'          `-.___,-'          `.",
    "   /       _,---._       _,---._     \\",
    "  /      ,'       `.   ,'       `.    \\",
    " /      /           \\ /           \\    \\",
    "|      |             V             |    |",
    " \\      \\           / \\           /    /",
    "  \\      `.       ,'   `.       ,'    /",
    "   \\       `-._,-'       `-._,-'    /",
    "    `.                             ,'",
    "      `.                         ,'",
    "        `-.                   ,-'",
    "           `-._           _,-'",
    "               `--.___,--'",
  ];

  return (
    <div className="relative select-none" aria-hidden="true">
      <pre className="font-mono text-eagle-blue text-xs sm:text-sm md:text-base leading-tight">
        {lines.map((line, i) => (
          <span key={i} className="block">{line}{"\n"}</span>
        ))}
      </pre>
      {/* Left eye */}
      <span
        id="eagle-left-eye"
        className="absolute font-mono text-spirit-gold text-xs sm:text-sm md:text-base"
        style={{
          top: "calc(16% + 0.1em)",
          left: "calc(38% + 0.5em)",
          transform: `translate(${leftPupil.x}px, ${leftPupil.y}px)`,
          transition: "transform 0.05s linear",
        }}
      >
        {pupilChar}
      </span>
      {/* Right eye */}
      <span
        id="eagle-right-eye"
        className="absolute font-mono text-spirit-gold text-xs sm:text-sm md:text-base"
        style={{
          top: "calc(16% + 0.1em)",
          left: "calc(56% + 0.2em)",
          transform: `translate(${rightPupil.x}px, ${rightPupil.y}px)`,
          transition: "transform 0.05s linear",
        }}
      >
        {pupilChar}
      </span>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const is404 = isRouteErrorResponse(error) && error.status === 404;

  if (!is404) {
    let details = "An unexpected error occurred.";
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
        <main id="main-content" className="flex-1 pt-16 p-4 container mx-auto">
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
      <main id="main-content" className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="text-center max-w-lg">
          <EagleEyes />
          <h1 className="text-6xl font-heading font-bold text-eagle-blue mt-6">
            404
          </h1>
          <p className="text-xl text-charcoal/70 mt-3 font-body">
            This eagle has searched far and wide, but that page doesn't exist.
          </p>
          <Link
            to="/"
            className="inline-block mt-8 bg-eagle-blue text-white font-heading font-bold text-sm px-6 py-3 rounded-full hover:bg-eagle-blue/90 transition-colors"
          >
            Fly Back Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
