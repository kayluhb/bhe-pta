# Prompt for the Cursor agent

Copy everything below the line into Cursor (Agent mode), with this handoff folder added to the workspace.

---

You're implementing a visual redesign of bheeagles.com (Barton Hills Elementary PTA) in this repository.

**Read first, in this order:**
1. `bhe-redesign-handoff/README.md`, which explains the package and how to read the mockups.
2. `bhe-redesign-handoff/SPEC.md`, the source of truth for layout, components, pages and behavior.
3. The relevant `bhe-redesign-handoff/reference/*.dc.html` mockup for each page as you build it (desktop and phone).

**Ground rules:**
- Work inside the existing stack and conventions of this repo (framework, routing, styling approach, components). Do not introduce a new framework or CSS system. If the repo uses Tailwind, extend the theme with `tokens/tailwind.theme.js`; otherwise use `tokens/tokens.css`.
- Keep existing integrations working: the donation link, the newsletter signup with its Cloudflare Turnstile check, the reimbursement form's submission backend and its Turnstile check, and the Smore and newsletter links in News.
- Keep all existing routes. Restyle pages that have no mockup using the shared header, footer and tokens.
- Use real data and content where the site already has it (events, news, sponsors). Mockup copy shows structure; where the live site has fresher content, use that.
- Leave bracketed placeholders like `[TIME]` visible in a way that's easy to find, or wire them to real data if it exists. Never invent values for them.
- Accessibility: real `<button>` and `<a>` elements, a `<label>` on every input, visible focus states, touch targets of at least 44px, and text contrast of at least 4.5:1. The token pairs in SPEC.md already pass.
- Use the `assets/bhe-eagle.svg` logo with `currentColor`, inline or as a component, so it can be green on light backgrounds and cream on dark ones.

**Order of work:**
1. Tokens and fonts (Bricolage Grotesque, Figtree) → shared Header (desktop and mobile menu), Footer and Button components.
2. Home page.
3. Annual Fund (Give), Events, Get Involved.
4. Reimbursement: rebuild the four-step form UI per SPEC.md and keep the existing submit logic and backend.
5. Restyle the remaining pages with the shared layout.

After each page, compare it against both mockups at 1440px and 390px wide, and list any deviations or open questions in your summary rather than guessing.
