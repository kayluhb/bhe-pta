# bheeagles.com redesign — SPEC

The source of truth for implementation. Exact pixel values live in the mockups (`reference/`); this file explains intent, structure and behavior.

**Look:** "Hill Country field day." Warm paper background, deep eagle green, sun-gold accent, chunky grotesque headlines, generous rounded shapes. Friendly and community-feeling but organized, a PTA rather than a startup.

---

## 1. Foundations

### Color (see `tokens/`)
- Page background is `paper` `#F6F1E7`. Cards are white with a 1px `border` `#E3DACB`.
- Primary is `green` `#173D2E`: headings, default text, primary buttons, and the dark bands (Annual Fund band, footer, date tiles).
- Accent is `gold` `#F3B23C`: the Give button, the hero fund callout, the newsletter band, the final "Submit request" button, and eyebrow labels on green. **Never use gold as text on light backgrounds.**
- Secondary text is `muted` `#4B5563`; lead paragraphs are `body` `#374151`.
- On green, text is `on-green` `#F6F1E7`, secondary text is `on-green-muted` `#D3E0D8`, and dividers are `green-line` `#2C5243`.
- Tag tints: `tint-green` (Community, regular-cadence roles), `tint-gold` (Prospective families, intermittent roles, the sales-tax notice), `tint-blue` (PTA meeting, one-time roles). Tag text is always `ink`.

### Type
- **Display:** Bricolage Grotesque 800 (700 for card titles), with tight tracking.
  - H1 hero: `clamp(48px, 6vw, 84px)`, line-height 0.98, letter-spacing −0.035em. Phone: 42–48px.
  - Section H2: 44px, letter-spacing −0.02em, line-height 1.05. Phone: 30–32px.
  - Band H2 (inside the green sections): `clamp(38px, 4.4vw, 60px)`, line-height 1.02, letter-spacing −0.03em.
  - Big figures ($930, $650, totals): 44–64px, weight 800.
- **Body:** Figtree. 17px desktop / 16px phone, line-height 1.55. Lead paragraphs 20–21px (17–18px on phone).
- **Eyebrow labels:** 13–14px, weight 700, uppercase, letter-spacing 0.12em. `green-2` on light backgrounds, `gold` on green.
- **Nav links:** 16px, weight 600.

### Layout
- Container: max-width 1240px, centered, 24px side padding (16px on phone).
- Sections: 64–88px vertical padding on desktop, 40–48px on phone.
- Grids use `repeat(auto-fit, minmax(min(100%, Npx), 1fr))`, so they collapse to one column on their own. Two-column page layouts (form + sidebar, events list + sidebar) use flex-wrap: main is `flex: 999 1 560px`, sidebar is `flex: 1 1 300px`.
- Breakpoint for the phone header and menu: < 768px.

### Shape and elevation
- Buttons and chips are pills (999px radius). Inputs: 12px. Date tiles and dropzones: 12–16px. Cards: 18–24px. Big panels: 28px.
- Shadows only on floating elements: the hero fund callout (`shadow-float`) and the Give form (`shadow-form`).
- Photo placeholders in the mockups are diagonal-hatched boxes labelled `[Photo …]`. Replace them with real images (`object-fit: cover`, same radius).

### Icons
Inline stroke icons at 1.8–2px stroke and 24px viewBox, sized 20–40px. Any line icon set matches (e.g. Lucide). Colors: `green-2` on cards, `green` in lists. Decorative icons are `aria-hidden`.

---

## 2. Shared components

### Header (desktop ≥ 768px)
- Paper background, 1px bottom border, 18px vertical padding.
- Left: eagle logo (50px tall, green) + a two-line wordmark: "Barton Hills Elementary" (Bricolage 800, 21px) over "PARENT TEACHER ASSOCIATION" (13px, 600, uppercase, 0.12em, muted). The whole lockup links to `/`.
- Right nav: About, News, Events, Programs, Parents, Get Involved, Contact. Each link has 10×12px padding. The current page is weight 700 with a 2px underline at 6px offset (`aria-current="page"`).
- **Give** button: gold pill, green text, weight 700, padding 12×22. It links to the Annual Fund page.
- The home page only has a utility bar above the header: green, 14px text, "Barton Hills Elementary · Austin ISD · School day 7:40 a.m.–3:10 p.m." on the left and a gold link "Prospective families: tour Nov 10 →" on the right. Drive the right side from the next prospective-parent event, or hide it when there isn't one.

### Header (phone < 768px)
- The logo is 36px; the wordmark is "Barton Hills" over "ELEMENTARY PTA". On the right: a gold Give pill and a 44×44 hamburger button (`aria-label="Open menu"`).
- **The menu panel isn't designed yet.** Build a full-screen or drop-down panel: paper background, nav links at 20px/700 with 52px-tall rows, a gold Give button at the bottom, and a close button. Trap focus while it's open and close it on Escape.
- On the home page, a green tour banner sits above the header (centered gold link).

### Footer (all pages)
- Green background, `on-green-muted` text at 15px, padding 72px top.
- A flex-wrap row of columns:
  1. Cream eagle logo (60px), "Barton Hills Elementary PTA" (Bricolage 800, 24px, cream), and the tagline "Supporting students, teachers and families to build a thriving school community for every Eagle."
  2. **Visit:** 2108 Barton Hills Drive, Austin, TX 78704 · School hours 7:40 a.m.–3:10 p.m.
  3. **Contact:** (512) 414-2013 (tel link) · Fax (512) 841-3849 · bhe@austinisd.org (mailto)
  4. **Quick links** (in two columns, keep all eight): Annual Fund, Reimbursement, News, Events, Get Involved, Parents, Archive, Newsletter Signup
  5. **Follow:** Facebook group · Instagram @bartonhillspta · Instagram @bheeagles
- Column labels: 13px, 700, uppercase, gold.
- Bottom bar (1px `green-line` top border): "© 2026 PTA Texas Congress Barton Hills Elementary" on the left; Privacy Policy and Terms of Use on the right.
- Phone: one column; Quick links stay two columns with 10px vertical padding per link so tap targets are 44px.

### Buttons
| Variant | Style | Used for |
|---|---|---|
| Primary | green fill, cream text, 700 | Most CTAs, form Next |
| Accent | gold fill, green text, 700–800 | Give, Give now, Continue to payment, Submit request |
| Secondary | transparent, 2px green border, green text | Get involved, Back, View sponsor tiers |
| On-dark secondary | 2px cream border, cream text | "Annual Fund details" on the green band |
| Text link | green, 700, "→" suffix | "View all events →", "All news →" |

Sizes: large is 16–18px vertical padding with 28px horizontal; medium is 12–14 by 22–24. All buttons are at least 44px tall.

### Cards and pieces
- **Date tile:** 72×80 (88×96 on Events; 56–60 wide on phone), green, 14px radius. Gold three-letter label (NOV / SAT / TUE) over a Bricolage 800 day number in cream.
- **Tag pill:** 3–8px vertical by 10–14px horizontal, 999px radius, a tint background, 12–15px at weight 600–700.
- **Program item:** 3px green top rule, icon, H3 at 20px/700, a 15px muted description.
- **Green band:** full-bleed green section with a large cream eagle watermark at about 7% opacity, positioned off one corner (`pointer-events: none`, `aria-hidden`, `overflow: hidden` on the section).
- **Newsletter band:** gold panel with a 28px radius. Heading "Get the Eagle Update", copy, and an email field (pill, 2px green border, white) with a green "Subscribe" button. Keep the Turnstile check.

---

## 3. Pages

### 3.1 Home (`/`)
1. **Utility bar** (see Header).
2. **Hero** (two columns that stack on phone):
   - Left: outlined pill "GO EAGLES · EST. 1964", H1 "Soaring together since 1964.", lead "Parents, teachers and neighbors keeping Barton Hills a school where every Eagle thrives — through volunteering, fundraising and advocacy.", and CTAs **Give to the Annual Fund** (primary → Annual Fund) and **Get involved** (secondary → Get Involved).
   - Right: a 460px-tall photo with a 28px radius. Overlapping its bottom-left corner is a gold callout card: "2026–27 ANNUAL FUND" / **$930** / "invested per student each year in programs, staff and resources."
3. **Coming up:** H2 plus "View all events →". Three event cards (date tile, eyebrow "Saturday · Community", title, one-line description). Pull the next three events from the events data and drop duplicates (the current site lists the Nov 10 PTA meeting twice).
4. **From the nest:** H2 plus "All news →". Three news cards (4:3 image, "Oct 31, 2026 · Newsletter", Bricolage title at 25px). Sort by date, newest first; the current site isn't sorted.
5. **Annual Fund band** (green, watermark): eyebrow "THE ANNUAL FUND", H2 "One gift. A whole year of Eagle programs.", and a paragraph. On the right, a paper card: **$650** "suggested per child", three checkmark items (Includes your PTA membership · Tax-deductible · Any amount makes a difference), a gold **Give now** button, and a "Need a reimbursement form?" link.
6. **Find your flock:** three white cards (Volunteer / Join the PTA / Sponsor as a business), each with an icon, H3, copy and a link.
7. **What your gift funds:** five program items (Cultural Arts, Reflections, Greenworks, Nick Akery Scholarship, Social-Emotional Learning) plus "View all programs →".
8. **Newsletter band.**
9. **Sponsors:** eyebrow "2026–27 LOCAL BUSINESS SPONSORS", H2 "Thank you, neighbors.", links "View all sponsors" and "Become a sponsor →". A grid of sponsor logos in white tiles (96px tall). Use the real sponsor logos from the existing site: Chubbies, JH Davidson & Associates, Revent Builds, Skelly Build, St. Elmo Brewery, Allensworth Construction Lawyers.
10. **Footer.**

### 3.2 Annual Fund / Give (`/annual-fund`)
1. **Hero + gift form** (two columns):
   - Left: eyebrow "2026–27 ANNUAL FUND", H1 "One gift funds a whole year at BHE.", a lead paragraph, and three checkmarks (membership included · tax-deductible · every amount counts).
   - Right: a white form card (28px radius, `shadow-form`):
     - **Choose an amount:** a 2×2 grid of 64px-tall toggle buttons: $650 "1 child · suggested" (selected by default), $1,300 "2 children", $930 "full cost per student", and "Other amount" (reveals a number input). The selected button is filled green.
     - **How often?:** a segmented control (One time / Monthly) on a `paper-2` track.
     - Name, Email, "Student name(s) & grade — optional", and an "My employer matches gifts" checkbox.
     - A gold **Continue to payment** button and the note "Secure checkout via [PAYMENT PROVIDER]…".
   - **Implementation:** this form should hand off to the existing donation provider (pass the amount and frequency if the provider supports it; otherwise just link through). Don't build payment processing.
2. **Where your gift goes** (green band, watermark): H2 "Programs, people and resources for every student." Use the real list from Get Involved rather than the six placeholder cards in the mockup: library, music, art and PE materials · faculty supplies and training · student t-shirts and yearbooks · cultural arts · social-emotional learning · outdoor maintenance · PE equipment · HEPA filters · technology · academic enrichment · school gardens.
3. **Other ways to help** (left) and **Questions** (right):
   - Other ways: three link cards (Employer matching, Local business sponsorship, Volunteer your time).
   - Questions: an accordion using native `<details>`, with the first item open. Items: "Why $650 per child?" · "Is my gift tax-deductible?" (Tax ID [EIN]) · "Does this include PTA membership?" · reimbursement → link to `/reimbursement`.
4. **Footer.**

### 3.3 Events (`/events`)
1. Title row: H1 "Events", a lead line, and an outlined "Add to my calendar" button (link to an iCal/Google Calendar feed; see Open questions).
2. **Filter chips** (`role="group"` with `aria-pressed`): All · Community · PTA meetings · Prospective families. They filter the list client-side by category. On phone, the chips scroll horizontally on one line.
3. **List + sidebar:**
   - List: events grouped under month headings ("NOVEMBER 2026"). Each card has an 88×96 date tile (weekday + day), a category tag pill, a Bricolage 700 28px title, a muted "time · location" line, and a primary pill button (RSVP for tours, otherwise Details). If the month has few events, show a dashed "More events will be posted soon / Browse past events in the archive →" box.
   - Sidebar: a green "Never miss an event" newsletter card (with Turnstile), and a white "Planning an event? Submit an event →" card.
4. **Footer.**
- Data: use the site's existing events source. Category-to-tint mapping: Community → green, Prospective families → gold, PTA meeting → blue.

### 3.4 Get Involved (`/get-involved`)
All content here comes from the current live page.
1. **Hero:** H1 "Find your flock." and the lead "The PTA runs on community help. Give an hour or a semester, a gift or a sponsorship — every bit keeps BHE soaring." Below it, four jump-link cards (first one filled green): Volunteer "25+ ways to help" · Annual Fund "$650 per child suggested" · Sponsor "For local businesses" · Join the PTA "Become a member". These link to section anchors.
2. **Volunteer opportunities** (`#volunteer`): H2, a subline, and a primary "Email the PTA to sign up" button (mailto:pta@bheeagles.com). Three cards, each with an icon, H3, subline and role pills:
   - **Regular cadence** (green pills): ACPTA & Vertical Team Rep, Book Buddies, Coffee Talk, Courtesy, Graphic Design, Social Media, Bulletin Board, Website
   - **Intermittent** (gold pills): Community Events, Eagle News, Grade-level Hospitality, CATCH Committee, Cultural Arts, FUNraising, Greenworks, Parties with a Purpose, Volunteer Coordinator, Teacher Grant Program, Reflections, School Merchandise, Scholarship Awards, School Supplies, Yearbook
   - **One-time** (blue pills): Carnival, Fall parent parties, Spring parent parties
3. **Annual Fund band** (`#fund`, green): H2 "$930 per student, every year.", copy about the $650 ask, CTAs "Give to the Annual Fund" (gold) and "Annual Fund details" (cream outline). On the right, a two-column divided list of the 11 funded items (as pills on phone).
4. **Sponsor** (`#sponsor`, white panel: "Become a sponsor" / "View sponsor tiers" → `/sponsors`) and **Join the PTA** (`#join`, gold panel: "Become a member" → the existing membership link), side by side.
5. **CTA:** an outlined panel "Ready to make a difference?" with a mailto button for pta@bheeagles.com.
6. **Footer.**

### 3.5 Reimbursement (`/reimbursement`)
A four-step check-request form. **Keep the existing submission backend, file upload handling and Turnstile check**; this is a UI rebuild.

**Layout:** title block (eyebrow "FOR VOLUNTEERS & STAFF", H1 "Reimbursement request", lead), then form column + sidebar. The sidebar has:
- A green "YOUR REQUEST" card with a live total and "N receipts · step X of 4".
- A white "Before you start" checklist: photos or PDFs of receipts (up to 10 files) · amounts before sales tax, which can't be reimbursed · the PTA budget account · only PTA-approved expenses qualify.
- "Questions? Email pta@bheeagles.com".

On phone, there's no sidebar: the checklist becomes a collapsed `<details>` under the title, and the total moves into a green bar at the top of step 2.

**Stepper:** four numbered circles (48px; 44 on phone) on a track with a green fill showing progress. Done steps are filled green with a check; the current step has a green outline with a bold label; upcoming steps have a light outline and muted text. Done steps are clickable to go back.
Labels: Request info · Receipts · Budget · Review (phone: Info · Receipts · Budget · Review).

**Step 1 — "Who should we pay?"**: Payable to\* · Email\* · Phone (optional) · Mailing address\* · Date of request (today, disabled) · Check needed by\* (date) · Invoice number (if any).

**Step 2 — "What did you buy?"**: one card per receipt (`card-alt` background), "Receipt N" header, and a Remove button when there's more than one. Fields: Date of purchase\* · Amount before tax\* (decimal) · What was purchased?\* · Store or website. Each card has an attachment dropzone ("Attach receipt photo or PDF", PNG/JPG/WebP/PDF up to 10MB; on phone, "Snap or attach receipt" with `capture="environment"`). Below the cards: a dashed "+ Add another receipt" button, and a gold-tint confirmation checkbox: "I confirm my amounts **do not include sales tax**. Sales tax can't be reimbursed." The live total is in the step header and the sidebar.

**Step 3 — "Which budget does this come from?"**: Budget account\* (select) · Notes for the treasurer (optional textarea). **Placeholder:** the real step 3 fields weren't captured; mirror the live form's fields and account list.

**Step 4 — "Review your request"**: summary sections (Payment details, Receipts with a line-item list and total, Budget account), each with an "Edit" link that jumps to its step. The Turnstile check goes here. The primary button becomes a gold **Submit request**.

**Done state:** a check badge, "Request submitted", "We've emailed a copy to {email}…", the total, and a "Submit another request" button that resets the form.

**Navigation:** Back (secondary) and Next (primary) buttons. Next labels: "Next: Add receipts" → "Next: Budget account" → "Next: Review" → "Submit request". On phone, the buttons are full width and stacked (Next above Back).

**Validation (add; the mockup doesn't enforce it):**
- Block Next until the step's required fields are valid. Show inline errors under fields (error color, linked with `aria-describedby`) and move focus to the first invalid field.
- Step 2 also needs the sales-tax checkbox checked, amounts greater than 0, at most 10 files in total and 10MB per file.
- Preserve form state when moving between steps, and ideally across an accidental refresh using sessionStorage.

---

## 4. Placeholders (never invent values)
- `[TIME]`, `[TIME · LOCATION]` on events → the events data
- Event locations "Barton Hills Elementary grounds" and "Meet at the front office" are guesses → the events data
- `[PAYMENT PROVIDER]` → the current donation provider name
- `[EIN]` → the PTA's tax ID
- `[BUDGET ACCOUNT 1–3]` → the real budget account list
- `[Security check]` → Cloudflare Turnstile
- `[Photo …]` boxes → real photos (ask the PTA)
- `[Sponsor logo]` tiles → existing sponsor logos

## 5. Verify with the PTA (added in the design, not on the current site)
- Give form extras: the $1,300 and $930 preset amounts, monthly giving, the employer-match checkbox, and the student name field. Drop any the donation provider can't support.
- The answer to "Why $650 per child?" (wording written for the design).
- Event short descriptions on the home page ("Pitch in on the grounds…" etc.).
- "Submit an event" on Events and "Add to my calendar".
- The reimbursement done-state wording ("We've emailed a copy…", "the treasurer will follow up").

## 6. Open questions
- Is there a calendar feed (iCal/Google) for "Add to my calendar"?
- Is there an event-submission form or inbox for "Submit an event"?
- Mobile menu design: build per §2 unless the PTA wants something else.
- Pages not yet designed (About, News, Programs, Parents, Contact, Archive, Sponsors): restyle with shared components for now.
