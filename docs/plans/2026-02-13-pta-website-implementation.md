# BHE PTA Website Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-featured Barton Hills Elementary PTA website with React Router 7 SSR on Cloudflare Workers, featuring daily-scraped school newsletters, Mailchimp PTA newsletters, Google Calendar integration, and a bold school-spirited design.

**Architecture:** React Router 7 in framework/SSR mode running on Cloudflare Workers. Cloudflare KV caches scraped newsletters and calendar events. A Cron Trigger worker runs daily at 5pm CST to refresh data from the school website, Mailchimp API, and Google Calendar ICS feed.

**Tech Stack:** React Router 7, Cloudflare Workers, Cloudflare KV, Tailwind CSS 4, Wrangler CLI, cheerio (HTML parsing), ical.js (ICS parsing)

**Focus:** Local development only. No Cloudflare deployment until explicitly requested.

---

## Task 1: Scaffold React Router 7 + Cloudflare Workers Project

**Files:**
- Create: `bhe-pta/` (entire project scaffold)
- Modify: `wrangler.toml` (add KV bindings, cron triggers)
- Modify: `vite.config.ts` (add Tailwind)
- Modify: `app/app.css` (Tailwind + theme)
- Create: `public/logo.svg`

**Step 1: Scaffold the project**

Run from `/Users/calebbrown/Projects/bhe-pta`:

```bash
npm create cloudflare@latest -- . --framework=react-router
```

Choose defaults when prompted. This creates the React Router 7 + Cloudflare Workers scaffold.

**Step 2: Install additional dependencies**

```bash
npm install tailwindcss @tailwindcss/vite cheerio ical.js
```

**Step 3: Add Tailwind to vite.config.ts**

```ts
// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    cloudflare(),
    tsconfigPaths(),
  ],
});
```

**Step 4: Set up Tailwind theme in app/app.css**

```css
@import "tailwindcss";

@theme {
  --color-eagle-blue: #1a3a6b;
  --color-spirit-gold: #d4a843;
  --color-creek-green: #2d6a4f;
  --color-warm-white: #faf8f5;
  --color-night-blue: #0d1b2a;
  --color-charcoal: #1a1a2e;
  --font-family-heading: "Montserrat", sans-serif;
  --font-family-body: "Inter", sans-serif;
}
```

**Step 5: Configure wrangler.toml for KV and cron**

```toml
name = "bhe-pta"
main = "./workers/app.ts"
compatibility_date = "2026-02-13"

[[kv_namespaces]]
binding = "BHE_NEWSLETTERS"
id = "placeholder-create-later"
preview_id = "placeholder-preview"

[[kv_namespaces]]
binding = "BHE_PTA_NEWSLETTERS"
id = "placeholder-create-later"
preview_id = "placeholder-preview"

[[kv_namespaces]]
binding = "BHE_CALENDAR"
id = "placeholder-create-later"
preview_id = "placeholder-preview"

[triggers]
crons = ["0 23 * * *"]
```

**Step 6: Add the eagle SVG logo**

Save the eagle SVG from the temp site to `public/logo.svg`:

```svg
<svg fill="none" height="97" viewBox="0 0 380 97" width="380" xmlns="http://www.w3.org/2000/svg">
  <path d="m179.667 2.8c-6.8 1.73334-13.467 2.53334-18.267 2.26667l-7.6-.53333 2.667 3.6c1.466 1.99996 3.6 5.99996 4.666 8.66666 2 4.8 2 5.3333-3.6 21.0667-3.066 8.9333-5.733 16.2666-5.866 16.5333-.134.1333-14.534-3.6-32.134-8.2667-17.466-4.6666-43.8663-11.6-58.533-15.4666-14.6667-3.8667-34.1333-8.9334-43.2-11.4667-9.2-2.4-16.8-4.2667-17.066663-4-.266666.2667 3.333333 6.8 7.866663 14.6667 6.4 10.9333 9.2 14.4 11.7333 14.9333 2.4.5333 4.9334 3.4667 8.8 9.6 3.3334 5.6 6.4 9.0667 8.1334 9.3333 1.6.2667 5.2 4 8.9333 9.4667l6.1333 8.9333 33.7334 3.6c18.4003 2 49.3333 5.2 68.6663 7.2l34.934 3.6 37.733-4.4c20.667-2.4 44.267-5.2 52.267-6.1333 8.133-.9333 21.6-2.5333 30-3.4667l15.333-1.6 8.667-8.4c6.133-6 9.733-8.5333 12.133-8.5333 2.8 0 3.867-1.2 6.533-7.6 3.6-8.8 6.8-12.4 11.067-12.4 2.533 0 4.133-2.4 10-14 3.733-7.7333 6.533-14 6.133-14s-20.666 5.0667-44.933 11.2c-24.4 6.2667-57.733 14.6667-74.133 18.8s-30.667 7.8667-31.6 8.2667c-1.2.4-2.4-.8-3.2-3.0667-1.734-4.4.133-6.4 7.866-8.5333 4-1.0667 5.067-.8 7.734 1.6 1.733 1.6 3.466 2.4 4 1.8666.666-.5333 1.066-5.8666 1.066-11.7333 0-10-.266-10.8-3.733-13.8667-2-1.7333-4.933-3.2-6.267-3.2-3.466 0-6.666-3.6-6.666-7.46663 0-8.66667-28.4-12.66667-50-7.06667zm35.333 4c6.267 1.33334 9.6 4 7.467 6.1333-.4.4-4.267 0-8.534-.9333-8.8-1.7333-19.333-.4-24.666 3.3333-2.667 1.8667-2.534 2 3.466 1.2 6-.9333 6.267-.8 6.267 2.5334 0 3.4666 5.333 8.9333 8.8 8.9333 3.067 0 2.133 1.6-6.8 12.2667-4.8 5.6-8.667 10.5333-8.667 10.8 0 .2666 4-1.6 9.067-4 4.933-2.4 9.6-4.4 10.267-4.4.8 0 3.333 4 5.733 8.8l4.4 8.9333-4.267 4.4c-2.4 2.5333-4.933 4.5333-5.733 4.5333s-3.333-2.2666-5.733-4.9333l-4.267-5.0667-4.8 5.7334c-2.667 3.0666-5.333 5.6-6 5.6s-2.533-2.2667-4.267-4.9334c-1.733-2.6666-3.466-5.4666-4-6.2666-.533-.8-3.2 1.0666-6.666 4.9333l-5.734 6.2667-7.2-5.6c-8-6-7.866-5.4667.934 6l5.866 7.8666 5.734-5.6 5.6-5.6 5.2 6.2667 5.066 6.2667 5.6-6.2667 5.467-6.4 5.067 5.6 5.066 5.6 4.8-8.9333 4.8-9.0667 14-3.6c61.734-15.6 116.934-29.7333 125.067-32 5.467-1.4667 10.133-2.4 10.533-2.1333 1.2 1.2-7.6 16.8-9.866 17.4666-3.067.9334-61.867 12-74.8 14.1334-16.934 2.8-9.6 2.6666 13.866-.1334 12.4-1.4666 28.934-3.4666 36.8-4.2666l14.134-1.6-2.667 5.3333c-1.467 2.9333-2.8 5.4667-2.933 5.6-.4.5333-24.934 4.1333-56.534 8.4-15.733 2-28.8 4.1333-29.333 4.6667-.4.4 1.6.4 4.4 0 8.133-1.0667 60.8-6 65.333-6h4l-4.666 4.6666-4.667 4.5334-52 6.1333c-28.533 3.3333-58.8 6.8-67.067 7.7333-14.666 1.7334-16.266 1.7334-82.133-4.9333l-67.3333-6.8-4-5.3333c-4.6667-6.1334-5.0667-7.3334-1.8667-6.5334 3.8667.9334 55.333 5.8667 59.067 5.7334 3.066-.1334-16.1337-3.2-55.6003-8.6667l-16.4-2.2667-4-6.1333c-2.1334-3.3333-3.4667-6.2667-2.8-6.5333.5333-.1334 15.8666 2.1333 34.1333 5.0666 18.1333 3.0667 33.2 5.2 33.4667 4.9334.4-.2667-3.2-1.3334-7.7334-2.1334-4.6666-.9333-22-4.6666-38.6666-8.2666-16.6667-3.6-30.5334-6.5334-30.9334-6.5334-.8 0-12.79996-18.2666-12.79996-19.4666 0-.4.53333-.4 1.2 0 .66666.5333 9.19996 2.9333 19.06666 5.3333 32 8.2667 69.2 17.8667 97.733 25.3333 15.467 4 28.4 6.9334 28.8 6.4 1.734-2 13.2-34 13.2-36.9333 0-1.7333-.533-4.6667-1.2-6.4-1.2-3.2-.933-3.3333 6.267-4.9333 4.133-.93336 10.933-2.40003 14.933-3.33336 9.334-2.26667 18-2.4 26.667-.53334zm-2.267 7.4667c-2.933 1.0666-2 5.7333 1.067 5.7333 2.267 0 2.667-.6667 2.267-3.2-.534-2.2667-.134-3.0667 1.2-2.5333 3.866 1.4666-.134 9.7333-4.667 9.7333-2.8 0-6.933-4-6.933-6.6667 0-3.0666 1.2-4 5.2-3.8666 1.866 0 2.666.4 1.866.8zm20.934 7.0666c3.866 0 7.866 4.4 8.8 9.6.933 5.7334.933 5.7334-4.267 3.0667-5.067-2.6667-12.933-2.4-21.467.5333-3.866 1.3334-7.066 1.8667-7.066 1.2 0-2.5333 8.8-11.7333 11.066-11.7333 1.334 0 2-.5333 1.6-1.3333-.4-.6667-.133-2.5334.667-4l1.467-2.8 3.466 2.8c1.867 1.4666 4.534 2.6666 5.734 2.6666zm1.333 17.3334c0 .6666-1.2 1.3333-2.667 1.3333-1.6 0-4.533.9333-6.8 2-3.866 2.1333-6.533 1.7333-6.533-.8 0-.6667 1.333-1.8667 3.067-2.5333 4-1.6 12.933-1.6 12.933 0z" fill="currentColor"/>
</svg>
```

**Step 7: Set up the Env interface in workers/app.ts**

Update the worker entry to declare the Env type with KV bindings and augment AppLoadContext:

```ts
// workers/app.ts
import { createRequestHandler } from "react-router";

interface Env {
  BHE_NEWSLETTERS: KVNamespace;
  BHE_PTA_NEWSLETTERS: KVNamespace;
  BHE_CALENDAR: KVNamespace;
  MAILCHIMP_API_KEY: string;
}

declare module "react-router" {
  interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Env>;
```

**Step 8: Verify dev server starts**

```bash
npm run dev
```

Expected: Dev server starts at http://localhost:5173 with the default React Router welcome page.

**Step 9: Commit**

```bash
git add -A && git commit -m "feat: scaffold RR7 + Cloudflare Workers with Tailwind and KV config"
```

---

## Task 2: Root Layout — Header, Footer, Navigation

**Files:**
- Modify: `app/root.tsx` (root layout with header/footer)
- Create: `app/components/Header.tsx`
- Create: `app/components/Footer.tsx`
- Modify: `app/routes.ts` (route definitions)
- Modify: `app/app.css` (add Google Fonts import)

**Step 1: Add Google Fonts to app.css**

Add to the top of `app/app.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800;900&display=swap');
```

**Step 2: Create Header component**

```tsx
// app/components/Header.tsx
import { NavLink, Link } from "react-router";

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
  return (
    <header className="bg-eagle-blue text-white">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="" className="h-12 w-auto invert" />
          <div>
            <div className="font-heading font-bold text-lg leading-tight">Barton Hills Elementary</div>
            <div className="text-spirit-gold text-sm font-semibold tracking-wide">PTA</div>
          </div>
        </Link>
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-spirit-gold ${
                  isActive ? "text-spirit-gold" : "text-white"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <Link
          to="/get-involved"
          className="hidden lg:inline-flex bg-spirit-gold text-night-blue font-bold text-sm px-4 py-2 rounded hover:bg-spirit-gold/90 transition-colors"
        >
          Join PTA
        </Link>
      </div>
    </header>
  );
}
```

**Step 3: Create Footer component**

```tsx
// app/components/Footer.tsx
import { Link } from "react-router";

const quickLinks = [
  { to: "/about", label: "About" },
  { to: "/news", label: "News" },
  { to: "/events", label: "Events" },
  { to: "/get-involved", label: "Get Involved" },
  { to: "/programs", label: "Programs" },
  { to: "/parents", label: "Parents" },
  { to: "/sponsors", label: "Sponsors" },
  { to: "/contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="bg-night-blue text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="font-heading font-bold text-lg mb-2">Barton Hills Elementary PTA</div>
          <p className="text-sm text-white/70 mb-4">
            Supporting our school community through parent involvement, fundraising, and advocacy since 1964.
          </p>
          <div className="flex gap-4">
            <a href="https://www.facebook.com/bartonhillselementary" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-spirit-gold transition-colors">Facebook</a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-spirit-gold transition-colors">Instagram</a>
          </div>
        </div>
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider text-spirit-gold mb-4">Quick Links</h3>
          <ul className="space-y-2">
            {quickLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-sm text-white/70 hover:text-white transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider text-spirit-gold mb-4">Contact</h3>
          <address className="text-sm text-white/70 not-italic space-y-1">
            <p>2108 Barton Hills Drive</p>
            <p>Austin, TX 78704</p>
            <p>Phone: (512) 414-2013</p>
            <p>Fax: (512) 841-3849</p>
            <p>Email: <a href="mailto:bhe@austinisd.org" className="hover:text-white">bhe@austinisd.org</a></p>
            <p>School Hours: 7:40 a.m. - 3:10 p.m.</p>
          </address>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        &copy; {new Date().getFullYear()} Barton Hills Elementary PTA. All rights reserved.
      </div>
    </footer>
  );
}
```

**Step 4: Update root.tsx with layout**

Wire up the Header and Footer in `root.tsx`, wrapping the `<Outlet />`.

**Step 5: Set up routes.ts**

```ts
// app/routes.ts
import { index, route } from "@react-router/dev/routes";

export default [
  index("./routes/home.tsx"),
  route("about", "./routes/about.tsx"),
  route("news", "./routes/news.tsx"),
  route("events", "./routes/events.tsx"),
  route("get-involved", "./routes/get-involved.tsx"),
  route("programs", "./routes/programs.tsx"),
  route("parents", "./routes/parents.tsx"),
  route("sponsors", "./routes/sponsors.tsx"),
  route("contact", "./routes/contact.tsx"),
];
```

**Step 6: Create stub route files**

Create each route file with a minimal placeholder component (just an `<h1>` with the page name) so the app compiles and navigates:

- `app/routes/home.tsx`
- `app/routes/about.tsx`
- `app/routes/news.tsx`
- `app/routes/events.tsx`
- `app/routes/get-involved.tsx`
- `app/routes/programs.tsx`
- `app/routes/parents.tsx`
- `app/routes/sponsors.tsx`
- `app/routes/contact.tsx`

**Step 7: Verify all routes work**

```bash
npm run dev
```

Navigate to each route in the browser. Verify the header and footer render on every page, NavLink highlights the active route, and the mobile layout doesn't break.

**Step 8: Commit**

```bash
git add -A && git commit -m "feat: add root layout with header, footer, nav, and stub routes"
```

---

## Task 3: Homepage — Hero, Events Preview, News Preview, Get Involved

**Files:**
- Modify: `app/routes/home.tsx`
- Create: `app/components/EventCard.tsx`
- Create: `app/components/NewsCard.tsx`

**Step 1: Build the homepage with static/placeholder content**

The homepage has these sections (top to bottom):
1. **Hero** — gradient bg with eagle blue, tagline "Soaring Together Since 1964", Join PTA + Donate CTAs
2. **Upcoming Events** — 3 placeholder event cards with date badges (month/day), title, description
3. **Latest News** — 3 placeholder news cards with date, title, excerpt
4. **Get Involved** — 3 cards: Volunteer, Join PTA, Annual Fund
5. **Programs Highlight** — horizontal scroll or grid of program cards
6. **Sponsors** — placeholder logos area

Use bold school-spirited design: diagonal gold accent stripe on the hero, strong blue/gold section headers, card shadows, gold borders. The hero should feel energetic — consider a diagonal clip-path or angled divider between sections.

**Step 2: Create EventCard component**

```tsx
// app/components/EventCard.tsx
export function EventCard({ month, day, title, description }: {
  month: string; day: string; title: string; description: string;
}) {
  return (
    <div className="flex gap-4 bg-white rounded-lg shadow-md p-4 border-l-4 border-spirit-gold">
      <div className="flex-shrink-0 bg-eagle-blue text-white rounded text-center px-3 py-2">
        <div className="text-xs uppercase font-bold">{month}</div>
        <div className="text-2xl font-heading font-bold">{day}</div>
      </div>
      <div>
        <h3 className="font-bold text-charcoal">{title}</h3>
        <p className="text-sm text-charcoal/70">{description}</p>
      </div>
    </div>
  );
}
```

**Step 3: Create NewsCard component**

```tsx
// app/components/NewsCard.tsx
export function NewsCard({ date, title, excerpt, href }: {
  date: string; title: string; excerpt: string; href: string;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
       className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-t-4 border-eagle-blue">
      <time className="text-xs font-semibold text-spirit-gold uppercase">{date}</time>
      <h3 className="font-bold text-charcoal mt-1 mb-2">{title}</h3>
      <p className="text-sm text-charcoal/70 line-clamp-3">{excerpt}</p>
    </a>
  );
}
```

**Step 4: Compose homepage with all sections and placeholder data**

Use the `@frontend-design` skill guidance for high design quality. Placeholder events and news so it looks complete. Use real content from the temp site where available (tagline, CTA text, etc.).

**Step 5: Verify homepage renders correctly**

```bash
npm run dev
```

Check desktop and mobile viewports. Verify all sections render, cards look good, CTAs link correctly.

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: build homepage with hero, events, news, get involved, programs, sponsors"
```

---

## Task 4: About Page

**Files:**
- Modify: `app/routes/about.tsx`

**Step 1: Build the about page with real content from temp site**

Sections:
1. **Page header** — "About Our PTA" with a bold blue banner
2. **Mission** — "BHE is supported by an active PTA committed to providing significant support for our teachers and students..."
3. **Key Initiatives** — cards or list:
   - Academic Enrichment (Cultural Arts, Reflections)
   - Parent Support Series (DEI focus)
   - Nick Akery Scholarship
   - Environment Programs (organic garden, composting)
   - BHE Annual Fund
4. **PTA Board** — placeholder grid of board member cards (name, role, photo placeholder)
5. **Meeting Minutes & Bylaws** — placeholder document list

**Step 2: Verify page renders**

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add about page with mission, initiatives, board, and documents"
```

---

## Task 5: Get Involved Page (Volunteer + Join + Donate)

**Files:**
- Modify: `app/routes/get-involved.tsx`

**Step 1: Build the get involved page with real content from temp site**

Sections:
1. **Hero banner** — "Get Involved" with motivational text
2. **Annual Fund** — $600/student, $200 requested, "Every Dollar Counts", list of funded initiatives
3. **Volunteer Opportunities** — three tabbed/sectioned areas:
   - Regular cadence (ACPTA Rep, Book Buddies, Coffee Talk, Courtesy, Graphic Design, Social Media, Bulletin Board, Website)
   - Intermittent (Community Events, Eagle News, Hospitality, CATCH, Cultural Arts, FUNraising, Greenworks, Parties with a Purpose, Parent Support Series, Volunteer Coordinator, Teacher Grants, Reflections, Merchandise, Scholarship, Supplies, Yearbook)
   - One-time (Carnival, seasonal parties)
4. **Join PTA** — membership info, link to external payment
5. **Donate** — Annual Fund CTA, link to external payment

Use real volunteer descriptions from the temp site.

**Step 2: Verify page renders**

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add get-involved page with volunteers, membership, and donations"
```

---

## Task 6: Contact Page

**Files:**
- Modify: `app/routes/contact.tsx`

**Step 1: Build the contact page with real content**

Sections:
1. **Contact info** — address, phone, fax, email, school hours
2. **Newsletter signup** — email form (can be non-functional placeholder for now)
3. **Social media** — Facebook + Instagram links
4. **Map** — optional embed or static image placeholder

Use the content from the temp site's contact page.

**Step 2: Verify page renders**

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add contact page with info, newsletter signup, and social links"
```

---

## Task 7: Programs Page

**Files:**
- Modify: `app/routes/programs.tsx`

**Step 1: Build the programs page**

Program cards with descriptions for:
- Cultural Arts Program — "presentations throughout the year by musicians, writers, and actors"
- PTA Reflections Program — art contest
- Greenworks / Environment Programs — organic garden and composting
- Nick Akery Scholarship — supporting BHE alumni
- Parent Support Series — DEI focus
- Social-Emotional Learning

Use placeholder descriptions where real content isn't available.

**Step 2: Verify and commit**

```bash
git add -A && git commit -m "feat: add programs page with program cards"
```

---

## Task 8: Parents Page

**Files:**
- Modify: `app/routes/parents.tsx`

**Step 1: Build the parents resource page**

Sections:
1. **School Overview** — hours, contact info
   - Main Office: Mon-Fri 7:30 AM - 4:00 PM
   - Student Hours: Mon-Fri 7:40 AM - 3:10 PM
   - Library: Mon-Fri 8:00 AM - 3:30 PM
2. **Quick Links** — cards linking to external resources:
   - AISD Parent Portal
   - SchoolCafe (lunch menus)
   - Official school website
   - Bus schedules
3. **Resources** — placeholder for additional parent info

**Step 2: Verify and commit**

```bash
git add -A && git commit -m "feat: add parents page with school info and resource links"
```

---

## Task 9: Sponsors Page

**Files:**
- Modify: `app/routes/sponsors.tsx`

**Step 1: Build the sponsors/partners page**

Sections:
1. **Partners in Education** — intro text about sponsor program
2. **Sponsor Tiers** — Diamond, Platinum, Gold, Silver placeholder sections with logo grid areas
3. **Become a Sponsor** — CTA section

Use placeholder logos and tier names. Content modeled after Doss PTA's Partners in Education program.

**Step 2: Verify and commit**

```bash
git add -A && git commit -m "feat: add sponsors page with partner tiers"
```

---

## Task 10: News Page with KV Loader (School Newsletters)

**Files:**
- Modify: `app/routes/news.tsx`
- Create: `app/lib/types.ts` (shared data types)
- Create: `app/lib/mock-data.ts` (mock data for local dev)

**Step 1: Define shared data types**

```ts
// app/lib/types.ts
export interface Newsletter {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  url: string;
  source: "school" | "pta";
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  category: string;
  description?: string;
}
```

**Step 2: Create mock data for local development**

```ts
// app/lib/mock-data.ts
import type { Newsletter, CalendarEvent } from "./types";

export const mockNewsletters: Newsletter[] = [
  {
    id: "eagle-update-2026-02-07",
    title: "Eagle Update - February 7, 2026",
    date: "2026-02-07",
    excerpt: "This week's update from Principal Achtermann covering upcoming events, curriculum updates, and community announcements.",
    url: "https://bartonhills.austinschools.org/news/eagle-update-february-7-2026",
    source: "school",
  },
  // ... add 5-6 more entries with realistic dates and titles
];

export const mockPtaNewsletters: Newsletter[] = [
  {
    id: "pta-news-2026-02-01",
    title: "February PTA Newsletter",
    date: "2026-02-01",
    excerpt: "Updates on the Annual Fund, upcoming volunteer opportunities, and Spirit Night details.",
    url: "#",
    source: "pta",
  },
  // ... add 3-4 more
];

export const mockEvents: CalendarEvent[] = [
  {
    id: "african-american-heritage",
    title: "African American Heritage Month",
    start: "2026-02-01",
    end: "2026-03-01",
    allDay: true,
    category: "Community Event",
  },
  // ... add 5-6 more with realistic school events
];
```

**Step 3: Build the news page with loader**

The loader should try to read from KV first, fall back to mock data in development:

```tsx
// app/routes/news.tsx
import type { Route } from "./+types/news";
import { mockNewsletters, mockPtaNewsletters } from "~/lib/mock-data";

export async function loader({ context }: Route.LoaderArgs) {
  let schoolNews = mockNewsletters;
  let ptaNews = mockPtaNewsletters;

  try {
    const kvSchool = await context.cloudflare.env.BHE_NEWSLETTERS.get("latest", "json");
    if (kvSchool) schoolNews = kvSchool as typeof schoolNews;
    const kvPta = await context.cloudflare.env.BHE_PTA_NEWSLETTERS.get("latest", "json");
    if (kvPta) ptaNews = kvPta as typeof ptaNews;
  } catch {
    // KV not available in local dev — use mock data
  }

  return { schoolNews, ptaNews };
}
```

Build the page with tabs for "Principal Updates" and "PTA News", each showing a card list.

**Step 4: Verify page renders with mock data**

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add news page with KV loader and mock data fallback"
```

---

## Task 11: Events Page with Calendar

**Files:**
- Modify: `app/routes/events.tsx`
- Create: `app/components/Calendar.tsx`

**Step 1: Build a simple calendar component**

Build a monthly calendar grid that renders events. Use CSS grid for the month layout. Keep it simple — no external calendar library needed for the initial version. Show events as colored dots/pills on their dates, with a list view below.

**Step 2: Build the events page with loader**

```tsx
// app/routes/events.tsx
import type { Route } from "./+types/events";
import { mockEvents } from "~/lib/mock-data";

export async function loader({ context }: Route.LoaderArgs) {
  let events = mockEvents;

  try {
    const kvEvents = await context.cloudflare.env.BHE_CALENDAR.get("events", "json");
    if (kvEvents) events = kvEvents as typeof events;
  } catch {
    // KV not available — use mock data
  }

  return { events };
}
```

**Step 3: Render the calendar with event list below**

The page should have:
- Month/year navigation (prev/next arrows)
- Calendar grid showing the current month
- Events as colored pills on their dates (color by category)
- Below the calendar: a list view of all events for the month

**Step 4: Verify calendar renders and navigates months**

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add events page with calendar component and mock data"
```

---

## Task 12: Update Homepage to Use Loaders

**Files:**
- Modify: `app/routes/home.tsx`

**Step 1: Add a loader to the homepage**

Replace the static placeholder data with a loader that fetches the latest 3 events and 3 newsletters from KV (with mock data fallback):

```tsx
export async function loader({ context }: Route.LoaderArgs) {
  let events = mockEvents.slice(0, 3);
  let news = [...mockNewsletters, ...mockPtaNewsletters]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  try {
    const kvEvents = await context.cloudflare.env.BHE_CALENDAR.get("events", "json");
    if (kvEvents) events = (kvEvents as typeof mockEvents).slice(0, 3);
    // ... similar for newsletters
  } catch {}

  return { events, news };
}
```

**Step 2: Wire up the component to use loader data**

Replace hardcoded placeholder data with `loaderData.events` and `loaderData.news`.

**Step 3: Verify homepage shows dynamic data**

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: wire homepage to loaders with mock data fallback"
```

---

## Task 13: Cron Worker — Newsletter Scraper

**Files:**
- Create: `workers/scheduled.ts` (or add to `workers/app.ts`)
- Create: `app/lib/scraper.ts` (newsletter scraping logic)

**Step 1: Build the newsletter scraping function**

```ts
// app/lib/scraper.ts
import * as cheerio from "cheerio";

export async function scrapeSchoolNews(): Promise<Newsletter[]> {
  const response = await fetch("https://bartonhills.austinschools.org/news");
  const html = await response.text();
  const $ = cheerio.load(html);

  const newsletters: Newsletter[] = [];
  // Parse the news page HTML — inspect the actual DOM structure
  // Look for article titles, dates, links, and excerpt text
  // The school site uses FullCalendar-style listing

  return newsletters;
}
```

Note: The exact selectors will need to be determined by inspecting the school news page DOM. Build the scraper to handle the structure found on `bartonhills.austinschools.org/news`.

**Step 2: Build the ICS calendar parser**

```ts
// app/lib/calendar.ts
export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  const response = await fetch(
    "https://bartonhills.austinschools.org/events/calendar.ics"
  );
  const icsText = await response.text();
  // Parse ICS format into CalendarEvent objects
  // Use ical.js or manual VEVENT parsing
  return events;
}
```

**Step 3: Add scheduled handler to workers/app.ts**

```ts
export default {
  fetch(request, env, ctx) { /* ... existing ... */ },

  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    const [newsletters, events] = await Promise.all([
      scrapeSchoolNews(),
      fetchCalendarEvents(),
    ]);

    await Promise.all([
      env.BHE_NEWSLETTERS.put("latest", JSON.stringify(newsletters)),
      env.BHE_CALENDAR.put("events", JSON.stringify(events)),
    ]);
  },
} satisfies ExportedHandler<Env>;
```

**Step 4: Test locally**

```bash
npx wrangler dev --test-scheduled
# In another terminal:
curl "http://localhost:8787/cdn-cgi/handler/scheduled"
```

Verify KV is populated (check logs).

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add cron worker for scraping newsletters and calendar"
```

---

## Task 14: Mailchimp Integration

**Files:**
- Create: `app/lib/mailchimp.ts`
- Modify: `workers/app.ts` (add to scheduled handler)

**Step 1: Build Mailchimp campaign fetcher**

```ts
// app/lib/mailchimp.ts
import type { Newsletter } from "./types";

export async function fetchMailchimpCampaigns(apiKey: string): Promise<Newsletter[]> {
  const dc = apiKey.split("-").pop(); // e.g., "us1"
  const response = await fetch(
    `https://${dc}.api.mailchimp.com/3.0/campaigns?sort_field=send_time&sort_dir=DESC&count=20&status=sent`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  const data = await response.json();
  return data.campaigns.map((c: any) => ({
    id: c.id,
    title: c.settings.subject_line,
    date: c.send_time,
    excerpt: c.settings.preview_text || "",
    url: c.archive_url,
    source: "pta" as const,
  }));
}
```

**Step 2: Add to scheduled handler**

Add the Mailchimp fetch to the cron handler alongside newsletter scraping and calendar fetch.

**Step 3: Add MAILCHIMP_API_KEY to .dev.vars**

```
MAILCHIMP_API_KEY=your-api-key-here
```

**Step 4: Test locally and commit**

```bash
git add -A && git commit -m "feat: add Mailchimp campaign integration for PTA newsletters"
```

---

## Task 15: Mobile Navigation (Hamburger Menu)

**Files:**
- Modify: `app/components/Header.tsx`

**Step 1: Add mobile hamburger menu**

Add a hamburger button visible on `lg:hidden` that toggles a mobile nav drawer. Use React state (`useState`) — no external libraries needed. The drawer should:
- Slide in from the right or drop down
- Show all nav links
- Include the "Join PTA" CTA
- Close when a link is clicked
- Close when clicking outside

**Step 2: Verify on mobile viewport**

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add mobile hamburger navigation"
```

---

## Task 16: Polish & Design Refinement

**Files:**
- Various component files
- `app/app.css`

**Step 1: Add diagonal accent patterns**

Add subtle diagonal stripe or chevron dividers between homepage sections using CSS clip-path or angled SVG dividers. Gold accent stripe on the hero section.

**Step 2: Add hover and transition effects**

Ensure all interactive elements have smooth transitions. Cards should lift slightly on hover. NavLinks should have underline animations.

**Step 3: Add focus styles for accessibility**

Ensure all focusable elements have visible focus rings. Check keyboard navigation works through the entire site.

**Step 4: Check responsive design**

Test at common breakpoints: 375px (phone), 768px (tablet), 1024px (desktop), 1440px (wide).

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: design polish — accents, transitions, accessibility, responsive"
```

---

## Task 17: Meta Tags & SEO

**Files:**
- Modify: `app/root.tsx`
- Add `meta` exports to each route file

**Step 1: Add meta function to each route**

Each route should export a `meta` function with appropriate title and description:

```tsx
export function meta() {
  return [
    { title: "About | Barton Hills Elementary PTA" },
    { name: "description", content: "Learn about the BHE PTA mission, initiatives, and leadership." },
  ];
}
```

**Step 2: Add OpenGraph and favicon to root**

Add OG tags, favicon link, and site-wide meta to `root.tsx`.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add meta tags and SEO for all routes"
```

---

## Execution Notes

- **Local dev focus:** All tasks use `npm run dev` for verification. No `wrangler deploy` until explicitly requested.
- **KV in local dev:** Wrangler dev creates local KV simulation. The mock data fallback ensures pages always render even without KV populated.
- **Mailchimp API key:** Store in `.dev.vars` for local dev. Will be a Worker secret in production.
- **Design skill:** Tasks 3, 15, and 16 should use the `@frontend-design` skill for high design quality.
- **Order:** Tasks 1-2 must be done first (scaffold + layout). Tasks 3-9 (pages) can be done in any order. Tasks 10-14 (data integration) depend on Tasks 1-2. Tasks 15-17 (polish) come last.
