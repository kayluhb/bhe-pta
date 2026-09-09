import {describe, expect, it} from 'vitest';

import {eventInWeek} from '../event-in-range';
import type {CalendarEvent} from '../types';

function event(
  overrides: Partial<CalendarEvent> & Pick<CalendarEvent, 'start' | 'end'>,
): CalendarEvent {
  return {
    allDay: true,
    category: 'Community Event',
    id: 'e',
    title: 'Event',
    ...overrides,
  };
}

/** Sunday of the week containing 2026-08-31 (Monday). */
const weekOfAug30 = new Date(2026, 7, 30);
/** Following Sunday. */
const weekOfSep6 = new Date(2026, 8, 6);

describe('eventInWeek', () => {
  it('includes an all-day event that falls on a day in the week', () => {
    const laborDay = event({
      end: '2026-09-08',
      id: 'labor-day',
      start: '2026-09-07',
      title: 'Labor Day',
    });

    expect(eventInWeek(laborDay, weekOfSep6)).toBe(true);
    expect(eventInWeek(laborDay, weekOfAug30)).toBe(false);
  });

  it('includes a timed event using its calendar date, not the exclusive end', () => {
    const dance = event({
      allDay: false,
      end: '2026-09-04T19:30:00',
      id: 'dance',
      start: '2026-09-04T17:30:00',
      title: 'Dance',
    });

    expect(eventInWeek(dance, weekOfAug30)).toBe(true);
    expect(eventInWeek(dance, weekOfSep6)).toBe(false);
  });

  it('includes a multi-day event that overlaps the week', () => {
    const camp = event({
      end: '2026-09-09',
      id: 'camp',
      start: '2026-09-03',
      title: 'Camp',
    });

    expect(eventInWeek(camp, weekOfAug30)).toBe(true);
    expect(eventInWeek(camp, weekOfSep6)).toBe(true);
  });

  it('treats all-day end dates as exclusive', () => {
    const fridayOnly = event({
      end: '2026-09-05',
      id: 'friday',
      start: '2026-09-04',
      title: 'Friday only',
    });

    expect(eventInWeek(fridayOnly, weekOfAug30)).toBe(true);
    expect(eventInWeek(fridayOnly, weekOfSep6)).toBe(false);
  });
});
