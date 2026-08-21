---
name: annual-fund-update
description: Use when updating BHE PTA Annual Fund progress, goals, or milestones on the website (raised amounts, offline donations, goal total, Art/Music/PE framing), or when the user asks to refresh fundraising numbers before deploy.
---

# Annual Fund Update

Publish Annual Fund progress and milestone framing from `app/data/annual-fund-campaign.ts`. Homepage and Get Involved load that object; there is no admin UI or KV cache for these numbers.

## Source of truth

| Field | Meaning |
|---|---|
| `onlineRaisedAmount` | Cheddar Up (or other online) total — keep cents if provided |
| `offlineRaisedAmount` | Deposited and cleared offline gifts only |
| `raisedAmount` | Always `onlineRaisedAmount + offlineRaisedAmount` — never hardcode the sum alone |
| `goalAmount` | Overall campaign goal (must match the final milestone `amount`) |
| `suggestedAskPerChild` | Suggested gift per student (shown on Annual Fund, Get Involved, meta) |
| `lastUpdated` | ISO date `YYYY-MM-DD` — bump whenever raised/goal/milestones change |
| `milestones[].amount` | **Cumulative** threshold toward the overall goal, not the tranche size |
| `milestones[].targetDate` | ISO `YYYY-MM-DD`; UI formats with month, day, and year |

Surfaces: `app/routes/home.tsx`, `app/routes/get-involved.tsx`, `app/routes/annual-fund.tsx` via `FundraisingProgress` / teaser / ask copy. Helpers: `app/lib/fundraising/progress.ts`.

## Process

1. Read `app/data/annual-fund-campaign.ts` and confirm current online, offline, goal, and milestones.
2. Clarify with the user anything missing:
   - New online total and/or offline total (offline = deposited & cleared only)
   - Goal or milestone label/amount/due-date changes
   - Whether this is numbers-only or also reframes copy (e.g. multi-year Art, Music & PE)
3. Edit campaign data:
   - Update `onlineRaisedAmount` / `offlineRaisedAmount` separately
   - Set `raisedAmount: onlineRaisedAmount + offlineRaisedAmount`
   - Set `goalAmount` and ensure the **last** milestone `amount` equals `goalAmount`
   - Keep intermediate milestone amounts cumulative and increasing
   - Set `lastUpdated` to today (or the user’s as-of date)
4. Sanity-check math before finishing:
   - Online + offline = raised (watch for $10 rounding mistakes when the user quotes a rounded online figure)
   - Displayed tranche for milestone *i* = `amount[i] - amount[i-1]` (first tranche = first `amount`)
   - Sum of displayed tranches = `goalAmount`
5. If due dates span more than one calendar year, keep year in `formatTargetDate` (already includes year).
6. Run `pnpm exec vitest run app/lib/fundraising/__tests__/progress.test.ts` if date/progress helpers changed; otherwise data-only edits need no test change.
7. Do **not** deploy unless the user asks. Remind them progress goes live on deploy.

## Milestone framing (current campaign)

Default three-milestone shape for 2026–27 (adjust only when the user changes strategy):

1. Fund Art, Music & PE for the current school year — early due date (e.g. by June 25)
2. Usual programming for students, teachers & staff — mid-year due date (e.g. by November 1)
3. Fund Art, Music & PE for the *next* school year — late-year / spring due date so funds are in the bank before summer break

When adding a next-year Art/Music/PE milestone, increase `goalAmount` by that year’s staffing cost (historically +$85,000) and append a cumulative final threshold equal to the new goal.

## Copy rules

- Milestone labels and descriptions live on the data object; the UI derives “— $X by Month D, YYYY” from tranche + `targetDate`.
- Prefer explicit school-year suffixes on Art/Music/PE labels (`'26-'27`, `'27-'28`) once multi-year goals exist.
- Do not invent offline totals; only add amounts the user confirms as deposited and cleared.

## Related site edits (only if asked)

| Ask | Where |
|---|---|
| PTA officers / year heading | `app/routes/about.tsx` (`boardMembers`, “Our YY–YY PTA Officers”); also `public/humans.txt` |
| Remove/add a program | `app/routes/programs.tsx`; check homepage program cards, Get Involved volunteer lists, About initiatives for the same name |

## Common issues

- **User says “add $50K to $118,998”** — current online may be `118_997.99` (displays as $118,998). Compute from the precise online constant + offline, then confirm the displayed raised total.
- **Milestone amounts look “wrong” in the UI** — UI shows tranche deltas; data stores cumulative thresholds.
- **Final milestone ≠ goal** — thermometer markers and “completes our $X goal” copy assume they match.
- **Forgot `lastUpdated`** — always bump it with any publishable change.
