# Barton Hills Elementary PTA Website — Design Document

**Date:** 2026-02-13
**Status:** Approved

## Overview

A full-featured PTA website for Barton Hills Elementary (the Eagles), built with React Router 7 in SSR/framework mode, deployed on Cloudflare Workers. The site aggregates content from multiple sources (school newsletters, Mailchimp PTA newsletters, Google Calendar) and serves as the central hub for the PTA community.

## Architecture

**Approach:** React Router 7 SSR on Cloudflare Workers + KV for cached data.

| Layer              | Technology                              |
| ------------------ | --------------------------------------- |
| Framework          | React Router 7 (framework/SSR mode)     |
| Hosting            | Cloudflare Workers                      |
| Styling            | Tailwind CSS 4                          |
| Data Cache         | Cloudflare KV                           |
| Scheduled Jobs     | Cloudflare Workers Cron Triggers        |
| Calendar           | Google Calendar ICS parsing             |
| Newsletter Scrape  | HTML parsing (cheerio or similar)       |
| Mailchimp          | Mailchimp Marketing API (campaigns)     |
| Deployment         | Wrangler CLI                            |
| Package Manager    | npm                                     |

## Site Map & Navigation

```
Homepage (/)
├── About (/about)
│   ├── PTA mission, initiatives, history (est. 1964)
│   ├── PTA Board / Leadership
│   └── Meeting minutes & Bylaws
├── News (/news)
│   ├── Principal Newsletters — "Eagle Updates" scraped daily at 5pm CST
│   └── PTA Newsletters — pulled from Mailchimp campaigns API
├── Events (/events)
│   └── Full interactive calendar from Google Calendar ICS feed
├── Get Involved (/get-involved)
│   ├── Volunteer opportunities
│   ├── Join PTA / Membership (links to external payment)
│   └── Donate / Annual Fund (links to external payment)
├── Programs (/programs)
│   ├── Cultural Arts, Reflections, Greenworks, etc.
│   └── Nick Akery Scholarship
├── Parents (/parents)
│   ├── School hours, contacts, bus info
│   └── Quick links (AISD portal, lunch menus, etc.)
├── Sponsors (/sponsors)
│   └── Partners in Education / Business sponsors
└── Contact (/contact)
    ├── Contact info, email, address, hours
    ├── Newsletter signup form
    └── Social media links (Facebook, Instagram)
```

**Header:** Eagle SVG logo + "Barton Hills Elementary PTA" + primary nav links
**Footer:** Contact info, quick links, social media (Facebook + Instagram), copyright

## Visual Design — Bold & School-Spirited

### Color Palette

| Role       | Color             | Hex       |
| ---------- | ----------------- | --------- |
| Primary    | Deep Eagle Blue   | `#1a3a6b` |
| Secondary  | Spirit Gold       | `#d4a843` |
| Accent     | Creek Green       | `#2d6a4f` |
| Background | Warm White        | `#faf8f5` |
| Dark       | Night Blue        | `#0d1b2a` |
| Text       | Charcoal          | `#1a1a2e` |

### Typography

- **Headings:** Bold sans-serif (Inter or Montserrat) — strong, confident
- **Body:** Clean sans-serif (Inter) — readable
- Eagle-themed decorative touches used sparingly

### Design Elements

- Eagle SVG logo prominently in header
- Subtle diagonal stripes or chevron patterns (pennant/spirit aesthetic)
- Gold accent lines and borders
- Card-based layouts with slight shadows
- Bold section headers with colored backgrounds (blue/gold alternating)
- School photos as hero backgrounds where available (placeholders initially)

## Homepage Layout

```
┌─────────────────────────────────────────┐
│  HEADER: Logo + Nav + "Join PTA" CTA    │
├─────────────────────────────────────────┤
│  HERO SECTION                           │
│  "Welcome to Barton Hills Elementary    │
│   PTA — Soaring Together Since 1964"    │
│  [Join PTA]  [Donate]                   │
├─────────────────────────────────────────┤
│  UPCOMING EVENTS (next 3-5 from cal)    │
│  ┌──────┐ ┌──────┐ ┌──────┐            │
│  │ Feb  │ │ Mar  │ │ Mar  │            │
│  │  14  │ │  5   │ │  20  │            │
│  │Event │ │Event │ │Event │            │
│  └──────┘ └──────┘ └──────┘            │
│                     [View All Events →] │
├─────────────────────────────────────────┤
│  LATEST NEWS (2-3 Eagle Updates + PTA)  │
│  Card layout with date, title, excerpt  │
│                      [All News →]       │
├─────────────────────────────────────────┤
│  GET INVOLVED (3 cards)                 │
│  [Volunteer] [Join PTA] [Annual Fund]   │
├─────────────────────────────────────────┤
│  PROGRAMS HIGHLIGHT (featured programs) │
├─────────────────────────────────────────┤
│  SPONSORS / PARTNERS                    │
├─────────────────────────────────────────┤
│  FOOTER: Contact, Links, Social, ©     │
└─────────────────────────────────────────┘
```

## Data Architecture

### Cloudflare KV Namespaces

- `BHE_NEWSLETTERS` — scraped Eagle Update data (title, date, excerpt, link)
- `BHE_PTA_NEWSLETTERS` — Mailchimp campaign data (subject, date, archive URL)
- `BHE_CALENDAR` — parsed Google Calendar ICS events

### Cron Trigger (daily 5pm CST / 23:00 UTC)

1. **School newsletters:** Fetch `https://bartonhills.austinschools.org/news`, parse titles/dates/excerpts, store in KV
2. **PTA newsletters:** Fetch from Mailchimp Marketing API `/campaigns` endpoint, store subject, send date, archive URL in KV
3. **Calendar events:** Fetch Google Calendar ICS from `bartonhills.austinschools.org/events/calendar.ics`, parse events, store upcoming events in KV

### React Router 7 Loaders

- **Homepage:** Latest 3 events + latest 3 newsletters (school + PTA) from KV
- **/news:** All newsletters from KV, paginated, with tabs for Principal vs PTA
- **/events:** All events from KV for full calendar rendering
- **Other pages:** Static content, no loader needed

## Content Sources

### Existing content (from temp site at bhe.treasurer-28c.workers.dev)

- **About:** PTA mission, initiatives list (Cultural Arts, DEI, Scholarship, Gardens, Annual Fund)
- **Volunteer:** Detailed opportunity listings (regular, intermittent, one-time), Annual Fund details ($600/student, $200 requested)
- **Parents:** School hours, contact info, resource links
- **Contact:** Newsletter signup, Facebook link, address/phone/fax/email/hours
- **Logo:** Eagle SVG at `/logo.svg`

### New content (placeholders until provided)

- PTA Board / Leadership names and roles
- Meeting minutes and bylaws documents
- Programs detail pages
- Sponsor/partner logos and tiers
- Instagram handle

## External Integrations

- **Mailchimp API:** Requires API key (stored as Cloudflare Worker secret)
- **Google Calendar ICS:** Public feed, no auth required
- **School news scrape:** Public page, no auth required
- **Payment links:** External URLs for membership and donations (no on-site payment processing)

## Social Media

- Facebook: https://www.facebook.com/bartonhillselementary
- Instagram: TBD (to be provided)
