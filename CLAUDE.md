# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev              # Local dev server with HMR (http://localhost:5173)
npm run build            # Production build (react-router build)
npm run deploy           # Build + deploy to Cloudflare Workers
npm run typecheck        # Full type check: cf-typegen → react-router typegen → tsc -b
npm run cf-typegen       # Regenerate Cloudflare binding types (worker-configuration.d.ts)
npm run preview          # Build + local preview via Vite
```

No test framework is currently configured.

## Architecture

**Stack**: React Router 7 (SSR) on Cloudflare Workers, Tailwind CSS v4, TypeScript

### Request Flow

`workers/app.ts` is the Cloudflare Worker entry point. It handles two concerns:
1. **HTTP requests** — delegates to React Router's server handler for SSR
2. **Cron triggers** (daily 11 PM UTC) — runs scrapers that populate KV caches

### Routing

Routes are defined in `app/routes.ts` using React Router v7's `route()`/`index()` helpers. Each route file in `app/routes/` exports a `loader` function and a default component.

### Data Loading Pattern

Route loaders access Cloudflare bindings via `context.cloudflare.env`:

```typescript
export async function loader({ context }: Route.LoaderArgs) {
  const data = await context.cloudflare.env.BHE_CALENDAR.get("events", "json");
  return { events: data ?? mockEvents };
}
```

All loaders follow a KV-first pattern with mock data fallback (`app/lib/mock-data.ts`).

### Cloudflare Bindings

| Binding | Type | Purpose |
|---------|------|---------|
| `BHE_NEWSLETTERS` | KV | Cached school newsletters (scraped) |
| `BHE_PTA_NEWSLETTERS` | KV | Cached PTA newsletters (Mailchimp) |
| `BHE_CALENDAR` | KV | Cached calendar events (parsed ICS) |
| `REIMBURSEMENT_DB` | D1 | Reimbursement submissions database |
| `R2_BUCKET` | R2 | Receipt file uploads |

Bindings are declared in `wrangler.jsonc`. The `Env` interface is in `workers/app.ts`.

### Cron Worker (`workers/app.ts` → `scheduled`)

Three data pipelines run daily:
- **Scraper** (`app/lib/scraper.ts`) — Cheerio-based scrape of school news page
- **Calendar** (`app/lib/calendar.ts`) — Manual ICS parser for school calendar feed
- **Mailchimp** (`app/lib/mailchimp.ts`) — Fetches sent campaign archive

### Database

D1 (SQLite) schema lives in `migrations/`. Tables: `submissions`, `receipt_entries`, `file_attachments`. Drizzle ORM packages are installed but schema files haven't been created yet — raw SQL migrations are used.

## Key Conventions

- **Path alias**: `~/` maps to `app/` (configured in `tsconfig.cloudflare.json`)
- **Styling**: Tailwind v4 with custom theme in `app/app.css`. Brand colors: `eagle-blue`, `spirit-gold`, `creek-green`, `warm-white`, `night-blue`, `charcoal`. Fonts: `font-heading` (Montserrat), `font-body` (Inter)
- **Type generation**: React Router auto-generates route types in `.react-router/types/`. Use `Route.LoaderArgs` and `Route.ComponentProps` from the generated type file for each route.
- **SSR**: Enabled via `react-router.config.ts`. Entry server uses `renderToReadableStream` with bot detection (`isbot`).
