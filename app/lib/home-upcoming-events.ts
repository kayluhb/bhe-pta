import type {CalendarEvent} from '~/lib/types';

function startOfDay(d: Date): Date {
  const copy = new Date(d);
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
