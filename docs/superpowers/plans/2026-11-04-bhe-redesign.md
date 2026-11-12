# BHE PTA Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the “Hill Country field day” visual redesign across the public PTA site per the handoff SPEC, keeping existing data loaders and integrations (CheddarUp, Turnstile, reimbursement submit/upload).

**Architecture:** Extend Tailwind v4 `@theme` with the handoff tokens; rebuild shared Header/Footer and small UI primitives; rewrite the five designed route UIs section-by-section against the mockups; restyle undesigned public pages with the new shell only. Admin routes stay as they are.

**Tech Stack:** React Router 8 (SSR) on Cloudflare Workers, Tailwind CSS v4, TypeScript, existing Vitest suite for logic helpers.

**Spec:** `docs/superpowers/specs/2026-11-04-bhe-redesign-design.md` (copy of `bhe-redesign-handoff/SPEC.md`). Mockups: `bhe-redesign-handoff/reference/*.dc.html`. Kickoff order: `bhe-redesign-handoff/AGENT_PROMPT.md`.

## Global Constraints

- Source of truth for UI is the handoff SPEC + mockups; never invent values for bracketed placeholders unless real data already exists in the repo.
- Keep routes, loaders, CheddarUp give URLs (`annualFundGiveUrl` / `annualFundGiveUrlWithUtm`), newsletter `/api/subscribe` + Turnstile, and reimbursement submit/upload/conversion pipelines unchanged in behavior.
- Tailwind v4 only — mirror tokens into `app/app.css` `@theme` (do not add a separate Tailwind v3 config).
- Use `bhe-eagle.svg` with `currentColor` for green-on-light / cream-on-dark; no ad-hoc hex outside tokens.
- Gold is never text on light backgrounds. Touch targets ≥ 44px. Every input has a `<label>`.
- Alphabetize JSX props where practical (repo convention). Path alias `~/` → `app/`.
- Payment provider label is **CheddarUp** (existing). Tax ID **74-6086853** already in `annual-fund.tsx` — use it for `[EIN]`.
- Suggested ask and school year come from `annualFundCampaign` / published campaign store, not hard-coded mockup numbers alone.
- Pages without mockups (About, News, Programs, Parents, Contact, Archive, Sponsors, Budget, Privacy, Terms): new Header/Footer/tokens only; do not invent new page layouts.
- Admin (`/admin/**`) is out of scope for visual redesign.

## Review Focus

- Mobile menu open: focus trapped, Escape closes, route change closes; screen reader gets `aria-label` / expanded state.
- Annual Fund “Continue to payment” always leaves the site to CheddarUp with amount/frequency only if the URL supports query params; never fake a payment flow.
- Reimbursement wizard still POSTs the same `/api/reimbursement/submit` payload shape after the UI rebuild.
- Home “Coming up” events: dedupe by id/start+title and take next three; do not show duplicate PTA meetings.
- Event filter chips map real calendar `category` strings onto Community / PTA meetings / Prospective families without dropping uncategorized events from “All”.

---

## File map

| Path                                           | Responsibility                                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `bhe-redesign-handoff/**`                      | Spec, mockups, tokens, eagle assets (already copied into repo)                             |
| `.cursor/rules/bhe-redesign.mdc`               | Agent stays on-spec while editing UI                                                       |
| `app/app.css`                                  | `@theme` bhe-* tokens, base body/focus, replace old brand colors over time                 |
| `app/root.tsx`                                 | Fonts (Bricolage + Figtree), body `bg-bhe-paper text-bhe-ink font-body`                    |
| `public/bhe-eagle.svg`                         | Logo asset for `<img>` fallbacks if needed                                                 |
| `app/components/EagleLogo.tsx`                 | Inline SVG `currentColor` logo                                                             |
| `app/components/ui/Button.tsx`                 | Primary / accent / secondary / on-dark / text-link variants                                |
| `app/components/ui/Container.tsx`              | max-width 1240 + gutters                                                                   |
| `app/components/ui/DateTile.tsx`               | Green date tile                                                                            |
| `app/components/ui/TagPill.tsx`                | Tint pills                                                                                 |
| `app/components/ui/GreenBand.tsx`              | Full-bleed green + eagle watermark                                                         |
| `app/components/Header.tsx` / `HeaderLogo.tsx` | Redesigned header + utility bar + mobile menu                                              |
| `app/components/Footer.tsx`                    | Redesigned five-column footer                                                              |
| `app/components/NewsletterSignup.tsx`          | Gold-band + green-band variants; keep Turnstile                                            |
| `app/routes/home.tsx`                          | Full home redesign                                                                         |
| `app/routes/annual-fund.tsx`                   | Hero + gift amount UI → CheddarUp                                                          |
| `app/routes/events.tsx`                        | Filter chips + list/sidebar (calendar month view can be dropped or demoted if not in SPEC) |
| `app/routes/get-involved.tsx`                  | Jump cards + volunteer / fund / sponsor / join                                             |
| `app/components/reimbursement/**`              | Four-step UI per SPEC; hooks/API unchanged                                                 |
| Other public routes                            | Token + shell restyle only                                                                 |
| `app/lib/event-categories.ts`                  | Map calendar categories → filter chips + tints                                             |

---

### Task 1: Tokens, fonts, and logo

**Files:**

- Modify: `app/app.css`
- Modify: `app/root.tsx` (`links` font stylesheet + `body` classes; focus outline → `bhe-gold`)
- Create: `app/components/EagleLogo.tsx`
- Create: `public/bhe-eagle.svg` (copy from handoff)
- Test: `app/lib/__tests__/design-tokens.test.ts` (assert CSS file contains required custom properties / `@theme` keys)

**Interfaces:**

- Consumes: handoff `tokens/tokens.css` values verbatim
- Produces: Tailwind utilities `bg-bhe-paper`, `text-bhe-green`, `font-display`, `font-body`, `rounded-card`, `rounded-panel`, `shadow-float`, `shadow-form`, `max-w-container`; `<EagleLogo className="…" />` inheriting `currentColor`

- [ ] **Step 1: Write the failing test**

```ts
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

describe('design tokens', () => {
  it('defines bhe theme colors and fonts in app.css', () => {
    const css = readFileSync(resolve('app/app.css'), 'utf8');
    for (const needle of [
      '--color-bhe-green: #173D2E',
      '--color-bhe-gold: #F3B23C',
      '--color-bhe-paper: #F6F1E7',
      '--font-family-display:',
      '--font-family-body:',
      'Bricolage Grotesque',
      'Figtree',
    ]) {
      expect(css).toContain(needle);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run app/lib/__tests__/design-tokens.test.ts`
Expected: FAIL (missing needles and/or missing file)

- [ ] **Step 3: Implement tokens + fonts + EagleLogo**

Merge handoff colors/fonts/radii/shadows/container into `@theme` as `--color-bhe-*`, `--font-family-display`, `--font-family-body`, `--radius-*`, `--shadow-*`, `--max-width-container`. Keep legacy `eagle-blue` etc. temporarily mapped to nearest bhe values or leave until Task 8 so admin does not break mid-work — prefer aliasing legacy names to new greens/golds in the same `@theme` block. Update `root.tsx` Google Fonts link to Bricolage Grotesque + Figtree. Implement `EagleLogo` from `bhe-redesign-handoff/assets/bhe-eagle.svg` as inline SVG with `fill="currentColor"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run app/lib/__tests__/design-tokens.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/app.css app/root.tsx app/components/EagleLogo.tsx public/bhe-eagle.svg app/lib/__tests__/design-tokens.test.ts
git commit -m "$(cat <<'EOF'
feat: add BHE redesign tokens, fonts, and eagle logo

EOF
)"
```

---

### Task 2: Shared UI primitives

**Files:**

- Create: `app/components/ui/Button.tsx`
- Create: `app/components/ui/Container.tsx`
- Create: `app/components/ui/DateTile.tsx`
- Create: `app/components/ui/TagPill.tsx`
- Create: `app/components/ui/GreenBand.tsx`
- Test: `app/components/ui/__tests__/Button.test.tsx`

**Interfaces:**

- Consumes: Task 1 tokens + `EagleLogo`
- Produces:
  - `Button({ variant: 'primary' | 'accent' | 'secondary' | 'on-dark' | 'text-link'; size?: 'md' | 'lg'; … })`
  - `Container({ children, className? })` → `max-w-container mx-auto px-[var gutter]`
  - `DateTile({ label: string; day: string | number; size?: 'sm' | 'md' | 'lg' })`
  - `TagPill({ tint: 'green' | 'gold' | 'blue'; children })`
  - `GreenBand({ children, className? })` — full-bleed green, watermark eagle ~7% opacity, `overflow-hidden`

- [ ] **Step 1: Write the failing test**

```tsx
import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {Button} from '~/components/ui/Button';

describe('Button', () => {
  it('renders accent variant as a real button', () => {
    render(<Button variant="accent">Give now</Button>);
    expect(screen.getByRole('button', {name: 'Give now'})).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run app/components/ui/__tests__/Button.test.tsx`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement the five primitives**

Match SPEC §2 Buttons / Cards and pieces. Pill radius on buttons; min height 44px. `GreenBand` uses decorative `EagleLogo` with `aria-hidden`.

- [ ] **Step 4: Run test + typecheck slice**

Run: `pnpm exec vitest run app/components/ui/__tests__/Button.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/components/ui
git commit -m "$(cat <<'EOF'
feat: add redesign Button, Container, DateTile, TagPill, GreenBand

EOF
)"
```

---

### Task 3: Header and Footer

**Files:**

- Modify: `app/components/Header.tsx`
- Modify: `app/components/HeaderLogo.tsx`
- Modify: `app/components/Footer.tsx`
- Modify: `app/components/NewsletterSignup.tsx` (gold band + optional green-card variants; keep Turnstile + `/api/subscribe`)
- Optional: `app/components/UtilityBar.tsx` if home-only bar is cleaner extracted
- Test: `app/components/__tests__/Header.test.tsx`

**Interfaces:**

- Consumes: `EagleLogo`, `Button`, `annualFundPath`
- Produces: Header with desktop nav (About…Contact), gold Give → `/annual-fund`, mobile menu panel per SPEC §2 (paper, 52px rows, focus trap, Escape). Home-only utility bar: left school day line; right prospective-families link when an upcoming event in that category exists (hide if none — pass optional prop or read from outlet context; simplest: optional `utilityBar?: { tourLabel: string; tourHref: string } | null` from home only via a small context or by rendering the bar inside `home.tsx` above Header… Prefer rendering utility bar inside `home.tsx` so Header stays dumb). Footer columns per SPEC; Quick Links keep all eight; social links keep existing URLs.

- [ ] **Step 1: Write the failing test**

```tsx
import {render, screen} from '@testing-library/react';
import {createMemoryRouter, RouterProvider} from 'react-router';
import {describe, expect, it} from 'vitest';
import {Header} from '~/components/Header';

describe('Header', () => {
  it('exposes Give link to annual fund and main nav', () => {
    const router = createMemoryRouter(
      [
        {path: '/', element: <Header />},
        {path: '/annual-fund', element: <div />},
      ],
      {initialEntries: ['/']},
    );
    render(<RouterProvider router={router} />);
    expect(screen.getByRole('link', {name: /give/i}).getAttribute('href')).toBe('/annual-fund');
    expect(screen.getByRole('navigation')).toBeTruthy();
  });
});
```

(Adjust to whatever RTL/router pattern the repo already uses in component tests.)

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run app/components/__tests__/Header.test.tsx`
Expected: FAIL or assertion fail on old markup

- [ ] **Step 3: Implement Header, HeaderLogo, Footer, NewsletterSignup restyle**

Desktop ≥768 / phone <768 per SPEC. Mobile menu not in mockups — build full-screen or dropdown as specified. Footer Visit/Contact copy from SPEC. Do not embed a second Turnstile on pages that already show newsletter (keep existing `showNewsletter` path logic or equivalent).

- [ ] **Step 4: Verify**

Run: `pnpm exec vitest run app/components/__tests__/Header.test.tsx && pnpm typecheck`
Expected: PASS

Manual: `pnpm dev` — 1440px and 390px header/footer vs `home.desktop` / `home.phone` chrome.

- [ ] **Step 5: Commit**

```bash
git add app/components/Header.tsx app/components/HeaderLogo.tsx app/components/Footer.tsx app/components/NewsletterSignup.tsx app/components/UtilityBar.tsx app/components/__tests__/Header.test.tsx
git commit -m "$(cat <<'EOF'
feat: redesign site Header, Footer, and newsletter band

EOF
)"
```

---

### Task 4: Home page

**Files:**

- Modify: `app/routes/home.tsx`
- Possibly reuse: `app/lib/sponsors.ts` `getFeaturedSponsors`, news mix helpers, calendar sanitize
- Test: `app/routes/__tests__/home-events.test.ts` for dedupe/next-three helper extracted from the route

**Interfaces:**

- Consumes: loader data shape already returned (`events`, `news`, `sponsors`, `annualFundCampaign`); shared UI; `annualFundPath` / give URL
- Produces: sections in SPEC §3.1 order. Hero photo: use best existing public image if available; otherwise keep a labeled placeholder box `[Photo campus]` (do not invent stock). Fund callout uses campaign ask / per-student figure from existing copy ($930 invested per student is in current marketing — keep if present on live site; do not invent a new number). Omit `FundraisingProgress` thermometer from home unless it can sit outside the SPEC layout without fighting the mockups — default: omit on home; progress remains on admin + optional elsewhere later.

- [ ] **Step 1: Extract + test upcoming-events helper**

```ts
// app/lib/home-upcoming-events.ts
export function pickHomeUpcomingEvents(
  events: CalendarEvent[],
  now: Date,
  limit = 3,
): CalendarEvent[];

// test: dedupes identical start+title, skips past, returns 3
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run app/lib/__tests__/home-upcoming-events.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement helper + rewrite `home.tsx` UI**

Compare to `reference/home.desktop.dc.html` and `home.phone.dc.html`. Wire newsletter band. Sponsors: Chubbies, JH Davidson, Revent, Skelly, St. Elmo, Allensworth from existing sponsor logos (filter/order from `getFeaturedSponsors` / year data — use real logo files under `public/sponsors`).

- [ ] **Step 4: Verify**

Run: `pnpm exec vitest run app/lib/__tests__/home-upcoming-events.test.ts && pnpm typecheck`
Manual compare 1440 / 390.

- [ ] **Step 5: Commit**

```bash
git add app/routes/home.tsx app/lib/home-upcoming-events.ts app/lib/__tests__/home-upcoming-events.test.ts
git commit -m "$(cat <<'EOF'
feat: redesign home page to BHE handoff layout

EOF
)"
```

---

### Task 5: Annual Fund (Give)

**Files:**

- Modify: `app/routes/annual-fund.tsx`
- Create: `app/components/annual-fund/GiveAmountForm.tsx` (client component for amount / frequency UI)
- Test: `app/components/annual-fund/__tests__/give-amount.test.ts` for building the outbound CheddarUp URL

**Interfaces:**

- Consumes: `annualFundCampaign`, `annualFundGiveUrlWithUtm`, `TAX_ID` / `74-6086853`, `fundedInitiatives` list already on the page / get-involved
- Produces: hero + form card; presets `$ask`, `$ask*2`, `$930`, Other; One time / Monthly segmented control; fields Name, Email, optional student names, employer-match checkbox; **Continue to payment** → external CheddarUp. If CheddarUp URL cannot encode amount/frequency, link through with UTM only and keep form fields as progressive enhancement / ignored — document in commit summary, do not invent a payment API. Green band “where your gift goes” uses the 11 real initiatives. FAQ accordion via `<details>`; first open. Replace mockup FAQ titles with SPEC list; use real EIN.

- [ ] **Step 1: Write failing URL helper test**

```ts
export function buildGiveCheckoutUrl(opts: {
  baseUrl: string;
  amount: number | null;
  frequency: 'once' | 'monthly';
  utmContent: string;
}): string;
```

Assert UTM params always present; amount query included only when `amount` is non-null **and** you confirm CheddarUp accepts it (if unknown, helper returns UTM-only and test locks that behavior).

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Implement form + page sections per SPEC §3.2 / mockups**

Drop extras the provider cannot support only if linking breaks; otherwise keep UI and pass what we can (SPEC §5 — leave monthly/employer/student in UI; handoff to CheddarUp).

- [ ] **Step 4: `pnpm typecheck` + vitest for helper; visual 1440/390 vs annual-fund mockups**

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: redesign Annual Fund page and give amount handoff

EOF
)"
```

---

### Task 6: Events page

**Files:**

- Modify: `app/routes/events.tsx` (and/or split list UI into `app/components/events/EventsList.tsx`)
- Create: `app/lib/event-categories.ts`
- Test: `app/lib/__tests__/event-categories.test.ts`
- Newsletter compact card reuses `NewsletterSignup`

**Interfaces:**

- Consumes: existing events loader (`CalendarEvent[]`)
- Produces: title row; filter chips `All | Community | PTA meetings | Prospective families` with `aria-pressed`; month-grouped list; date tiles; category `TagPill`; RSVP vs Details button heuristic (tour/prospective → RSVP label if URL looks like signup, else Details); sidebar newsletter + “Submit an event” card — if no real submission URL exists, use `mailto:pta@bheeagles.com` with subject (do not invent a form). “Add to my calendar”: if no ICS public URL exists in repo, omit the button or link to the school calendar source already used by the scraper — search codebase first; never invent a feed URL. Month empty-state dashed box per SPEC.

- [ ] **Step 1: Write category mapping tests**

Map strings containing / equaling existing categories (e.g. `Community Event`, `PTA Meeting`, prospective/tour wording) onto filter ids + tints; unknown → still visible under All, tint green as Community default or unstyled — pick one and test it.

- [ ] **Step 2: FAIL then implement `event-categories.ts`**

- [ ] **Step 3: Rebuild events UI per SPEC §3.3**; remove or hide the old month-grid calendar if it conflicts with the list+sidebar mockup (SPEC shows list, not the old Calendar grid).

- [ ] **Step 4: vitest + typecheck + visual vs events mockups**

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: redesign Events list with category filters

EOF
)"
```

---

### Task 7: Get Involved

**Files:**

- Modify: `app/routes/get-involved.tsx`
- Keep volunteer role arrays already in the file (align labels with SPEC where SPEC is more precise)

**Interfaces:**

- Consumes: campaign loader, `annualFundPath`, `corporateContributionsUrl`, existing membership link from live page (find current “Become a member” href in the file or sponsors/about — reuse, do not invent)
- Produces: SPEC §3.4 sections and anchors `#volunteer` `#fund` `#sponsor` `#join`

- [ ] **Step 1: No new unit test required beyond typecheck** — page is content/layout. Spot-check mailto `pta@bheeagles.com`.

- [ ] **Step 2: Rewrite page markup to match get-involved desktop/phone mockups**

- [ ] **Step 3: `pnpm typecheck`; visual 1440/390**

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: redesign Get Involved page

EOF
)"
```

---

### Task 8: Reimbursement form UI

**Files:**

- Modify: `app/routes/reimbursement.tsx`
- Modify: `app/components/reimbursement/FormWizard.tsx`
- Modify: `app/components/reimbursement/FormProgress.tsx`
- Modify: `app/components/reimbursement/steps/*.tsx`
- Modify: `app/components/reimbursement/ui/{Button,Input,Select,FileUpload}.tsx` to use bhe tokens (or switch steps to shared `ui/Button`)
- Prefer keeping: `useFormState`, upload hooks, Turnstile, submit handler payload
- Test: extend or add `app/hooks/__tests__/useFormState.test.tsx` only if validation rules change; add step-gate helper test if you extract `canProceed(step, state)`

**Interfaces:**

- Consumes: existing form state + `/api/reimbursement/submit`
- Produces: SPEC §3.5 layout (sidebar total + checklist; phone: details checklist + top total on step 2); stepper labels Request info / Receipts / Budget / Review; step copy; sales-tax checkbox; done state may remain `reimbursement.success` route — either restyle success page to match done-state mockup or inline done state then navigate; **do not break** success query `?id=`.

- [ ] **Step 1: Write failing test for step validation gate if extracted**

```ts
export function canProceedToNext(
  step: number,
  state: FormState,
  salesTaxConfirmed: boolean,
): boolean;
```

- [ ] **Step 2: FAIL → implement gate; wire Next buttons**

- [ ] **Step 3: Restyle wizard + steps to mockups; keep Field names bound to existing state keys**

- [ ] **Step 4: Run `pnpm exec vitest run app/hooks/__tests__/useFormState.test.tsx app/routes/__tests__/api.reimbursement.submit.test.ts` and `pnpm typecheck`**

Manual: walk 4 steps at 1440 and 390 vs reimbursement mockups.

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: redesign reimbursement wizard UI without changing submit API

EOF
)"
```

---

### Task 9: Restyle remaining public pages

**Files:**

- Modify: `app/routes/about.tsx`, `news.tsx`, `programs.tsx`, `parents.tsx`, `contact.tsx`, `archive.tsx`, `sponsors.tsx`, `budget.tsx`, `privacy.tsx`, `terms.tsx`, `official-name.tsx`, `reimbursement.success.tsx`, `pay-me.tsx` as needed for token class names
- Replace `eagle-blue` / `spirit-gold` / `night-blue` / `warm-white` / `font-heading` usages on these pages with `bhe-*` / `font-display` where straightforward
- Sponsors page: update tier color classes to bhe tokens; keep data

**Interfaces:**

- Consumes: new Header/Footer automatically via root
- Produces: readable pages on paper background; no new section inventing

- [ ] **Step 1: Grep public routes for legacy color classes; replace systematically**

- [ ] **Step 2: `pnpm typecheck` && `pnpm lint`**

- [ ] **Step 3: Smoke `pnpm dev` on each route once**

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: restyle remaining public pages with redesign tokens

EOF
)"
```

---

### Task 10: Final pass and open questions log

**Files:**

- Create: `docs/superpowers/plans/2026-11-04-bhe-redesign-open-questions.md` (short checklist of SPEC §5–§6 items still unresolved)

- [ ] **Step 1: Diff each designed page against desktop + phone mockups; note deviations**

- [ ] **Step 2: Run full `pnpm test && pnpm typecheck && pnpm lint`**

- [ ] **Step 3: Write open-questions doc** (calendar feed, submit-an-event, photos still placeholder, CheddarUp amount params, monthly giving, etc.)

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
docs: record redesign open questions and verification notes

EOF
)"
```

---

## Self-review notes

- SPEC §1–§3.5 and §4 placeholders each map to Tasks 1–8; §5–§6 → Task 10 doc, not silent invention.
- Undesigned pages → Task 9 only.
- Admin excluded.
- Fundraising thermometer intentionally omitted from SPEC home/AF layouts; campaign data still drives ask + give URL.
- Legacy color aliases in Task 1 reduce breakage before Task 9 finishes.
