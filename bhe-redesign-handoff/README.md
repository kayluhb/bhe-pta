# bheeagles.com redesign — implementation handoff

Barton Hills Elementary PTA site redesign. This package is the brief for a coding agent to implement the new design in the existing bheeagles.com codebase.

## What's in here

| Path | What it is |
|---|---|
| `AGENT_PROMPT.md` | Paste this into Cursor to kick off the work. |
| `SPEC.md` | The source of truth: layout, components, every page section by section, interactions, placeholders, open questions. |
| `tokens/tokens.css` | Design tokens as CSS custom properties. |
| `tokens/tailwind.theme.js` | The same tokens as a Tailwind `theme.extend` block. |
| `assets/bhe-eagle.svg` | Eagle logo, `fill="currentColor"` — use this one in code and color it with CSS. |
| `assets/bhe-eagle-green.svg`, `assets/bhe-eagle-cream.svg` | Fixed-color copies (green on light, cream on dark) used in the mockups. |
| `reference/*.dc.html` | The design mockups for each page, desktop and phone. Read for exact sizes, spacing and copy. |
| `.cursor/rules/bhe-redesign.mdc` | A Cursor rule that keeps the agent on-spec while it works. Copy into the repo's `.cursor/rules/`. |

## Pages

| Page | Route (existing site) | Desktop mockup | Phone mockup |
|---|---|---|---|
| Home | `/` | `home.desktop` | `home.phone` |
| Annual Fund / Give | `/annual-fund` | `annual-fund.desktop` | `annual-fund.phone` |
| Events | `/events` | `events.desktop` | `events.phone` |
| Get Involved | `/get-involved` | `get-involved.desktop` | `get-involved.phone` |
| Reimbursement | `/reimbursement` | `reimbursement.desktop` | `reimbursement.phone` |

Not designed yet (keep the current pages, restyled with the new header, footer and tokens): About, News, Programs, Parents, Contact, Archive, Sponsors.

## How to read the mockups

The `.dc.html` files are prototypes from a design tool, not production code.

- **Use:** inline `style="…"` values (sizes, spacing, colors, radii), element structure, copy, and the order of sections.
- **Ignore:** `<x-dc>`, `<helmet>`, `<sc-if>`, `<sc-for>`, `{{ … }}` holes, `support.js`, and the `DCLogic` class. They belong to the prototype runtime. `{{accent}}` is gold `#F3B23C`.
- The reimbursement files' `DCLogic` class does show the intended form behavior (steps, receipt rows, running total). Port that behavior into the app's own framework.
- Desktop mockups are fluid pages (max content width 1240px). Phone mockups are drawn at 390px wide and show the small-screen layout.

## Before you ship

Search `SPEC.md` for **Placeholders** and **Verify with the PTA**. Several items are bracketed placeholders (e.g. `[TIME]`, `[EIN]`, `[BUDGET ACCOUNT 1]`), and a few features were added in the design that the PTA hasn't confirmed yet.
