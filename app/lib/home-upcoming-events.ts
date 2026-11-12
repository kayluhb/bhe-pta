import {PROSPECTIVE_EVENT_PATTERN} from '~/lib/event-categories';
import type {CalendarEvent} from '~/lib/types';

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function eventDay(start: string): Date {
  return start.includes('T') ? new Date(start) : new Date(`${start}T00:00:00`);
}

/** Upcoming events for the home “Coming up” strip: future only, deduped by start+title. */
export function pickHomeUpcomingEvents(
  events: CalendarEvent[],
  now: Date,
  limit = 3,
): CalendarEvent[] {
  const today = startOfDay(now);
  const seen = new Set<string>();
  const upcoming: CalendarEvent[] = [];

  const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start));
  for (const event of sorted) {
    if (eventDay(event.start) < today) continue;
    const key = `${event.start}::${event.title.trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    upcoming.push(event);
    if (upcoming.length >= limit) break;
  }

  return upcoming;
}

/** Prefer the next prospective-family event; otherwise the next upcoming event. */
export function pickHomeBannerEvent(events: CalendarEvent[], now: Date): CalendarEvent | undefined {
  const upcoming = pickHomeUpcomingEvents(events, now, 12);
  const prospective = upcoming.find((event) =>
    PROSPECTIVE_EVENT_PATTERN.test(`${event.category} ${event.title}`),
  );
  return prospective ?? upcoming[0];
}
