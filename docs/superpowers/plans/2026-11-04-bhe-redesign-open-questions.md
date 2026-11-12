# BHE redesign — open questions & verification notes

Recorded after implementing `docs/superpowers/plans/2026-11-04-bhe-redesign.md` against `bhe-redesign-handoff/SPEC.md`.

## Still unresolved (SPEC §5–§6)

- **Calendar feed** for “Add to my calendar” — no public ICS/Google URL confirmed in repo; button omitted on Events.
- **Submit an event** — no submission form; Events sidebar uses `mailto:pta@bheeagles.com?subject=Submit%20an%20event`.
- **Prospective-families utility bar CTA** — home utility bar shows school-day line only; tour link hidden until a prospective event is wired from the home loader.
- **CheddarUp amount/frequency query params** — Resolved: CheddarUp has no documented amount/frequency URL params. Annual Fund give card is a UTM handoff; donors choose amount on CheddarUp.
- **Why $650 wording** — FAQ text written from SPEC/campaign ask; PTA should confirm final copy.
- **Reimbursement done-state copy** — still uses `/reimbursement/success` route; confirm “we've emailed a copy…” wording with PTA.
- **Hero / news photos** — home hero uses `/spring-fling-2026.jpg`; news cards use tint placeholders (no per-story images in data).
- **Mobile menu** — built per SPEC §2 (full panel); PTA may want a different treatment.

## Mockup deviations (known)

- Fundraising thermometer omitted from Home and Annual Fund public layouts (SPEC layouts don't include it; admin campaign store unchanged).
- Events page dropped the old month-grid calendar in favor of the SPEC list + sidebar.
- Reimbursement step field components retain much of their prior internal markup; chrome/sidebar/stepper match the redesign first.
- Undesigned pages (About, News, etc.): shared Header/Footer/tokens + simplified title bands only — not full mockups.
- Admin UI intentionally unchanged.

## Placeholders wired vs left

| Item                 | Resolution                                                                        |
| -------------------- | --------------------------------------------------------------------------------- |
| `[EIN]`              | `74-6086853` (existing)                                                           |
| `[PAYMENT PROVIDER]` | CheddarUp                                                                         |
| `[TIME · LOCATION]`  | Events list uses description snippet when present; else shows `[TIME · LOCATION]` |
| Budget accounts      | Existing live form list (unchanged)                                               |
| Turnstile            | Kept on newsletter + reimbursement                                                |
