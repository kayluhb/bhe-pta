# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
pnpm dev              # Local dev server with HMR (http://localhost:5173)
pnpm build            # Production build (react-router build)
pnpm prod:deploy      # Build + deploy to Cloudflare Workers
pnpm typecheck        # Full type check: cf-typegen → react-router typegen → tsc -b
pnpm cf-typegen       # Regenerate Cloudflare binding types (worker-configuration.d.ts)
pnpm preview          # Build + local preview via Vite
```

No test framework is currently configured.

## Architecture

**Stack**: React Router 7 (SSR) on Cloudflare Workers, Tailwind CSS v4, TypeScript

### Request Flow

`workers/app.ts` is the Cloudflare Worker entry point. It handles three concerns:
1. **HTTP requests** — delegates to React Router's server handler for SSR
2. **Cron triggers** (daily **02:00 UTC**, `0 2 * * *` in [`wrangler.jsonc`](wrangler.jsonc)) — runs scrapers that populate KV caches
3. **Queue consumer** — [`bhe-pta-receipt-conversion`](wrangler.jsonc) processes receipt conversion jobs (Gemini)

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
| `R2_ARCHIVE` | R2 | Archive bucket (`api.archive.file`) |
| `RECEIPT_CONVERSION_QUEUE` | Queue | Async receipt → PDF pipeline |
| `AI` | Workers AI | Budget account suggestions (`@cf/moonshotai/kimi-k2.6`) |

Bindings are declared in `wrangler.jsonc`. The `Env` interface is in `workers/app.ts`.

### Cron Worker (`workers/app.ts` → `scheduled`)

At **02:00 UTC** daily, three data pipelines run:
- **Scraper** (`app/lib/scraper.ts`) — Cheerio-based scrape of school news page
- **Calendar** (`app/lib/calendar.ts`) — Manual ICS parser for school calendar feed
- **Mailchimp** (`app/lib/mailchimp.ts`) — Fetches sent campaign archive

### Database

D1 (SQLite) schema lives in `migrations/`. Tables include `submissions`, `receipt_entries`, `file_attachments`, `receipt_conversion_jobs`. Drizzle ORM packages are installed but schema files haven't been created yet — raw SQL migrations are used.

### Cloudflare production checklist

Periodically confirm in the Cloudflare dashboard (this cannot be read from git):

1. **Workers → `bhe-pta` → Triggers** — Only the expected cron (`0 2 * * *`); remove stray triggers on old versions if any appear.
2. **Queues → `bhe-pta-receipt-conversion`** — Backlog depth, retry rate, age of oldest message; tune [`wrangler.jsonc`](wrangler.jsonc) consumer settings if needed.
3. **Analytics / Billing** — Workers invocations, Queues operations, R2 storage and class A/B ops, Workers AI usage, and external Gemini usage (API key billing).
4. **D1 (optional)** — Rows stuck in `receipt_conversion_jobs` with `status = 'processing'` for a long time, or very old `queued`, may indicate a stuck consumer or abandoned uploads.

## Key Conventions

- **Props and attributes**: Alphabetize JSX/TSX props and HTML attributes where possible (e.g. `className` before `href`, `id` before `onClick`).
- **Path alias**: `~/` maps to `app/` (configured in `tsconfig.cloudflare.json`)
- **Styling**: Tailwind v4 with custom theme in `app/app.css`. Brand colors: `eagle-blue`, `spirit-gold`, `creek-green`, `warm-white`, `night-blue`, `charcoal`. Fonts: `font-heading` (Montserrat), `font-body` (Inter)
- **Type generation**: React Router auto-generates route types in `.react-router/types/`. Use `Route.LoaderArgs` and `Route.ComponentProps` from the generated type file for each route.
- **SSR**: Enabled via `react-router.config.ts`. Entry server uses `renderToReadableStream` with bot detection (`isbot`).
