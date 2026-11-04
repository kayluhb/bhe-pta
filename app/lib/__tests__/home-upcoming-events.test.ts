import {describe, expect, it} from 'vitest';

import {pickHomeUpcomingEvents} from '~/lib/home-upcoming-events';
import type {CalendarEvent} from '~/lib/types';

function event(partial: Partial<CalendarEvent> & Pick<CalendarEvent, 'id' | 'title' | 'start'>): CalendarEvent {
  return {
    allDay: true,
    category: 'Community Event',
    end: partial.start,
    ...partial,
  };
}

describe('pickHomeUpcomingEvents', () => {
  const now = new Date('2026-11-04T12:00:00');

  it('skips past events, dedupes identical start+title, returns up to three', () => {
    const events = [
      event({id: '1', title: 'Past picnic', start: '2026-10-01'}),
      event({id: '2', title: 'PTA Meeting', start: '2026-11-10'}),
      event({id: '2b', title: 'PTA Meeting', start: '2026-11-10'}),
      event({id: '3', title: 'Carnival', start: '2026-11-15'}),
      event({id: '4', title: 'Tour', start: '2026-11-20'}),
      event({id: '5', title: 'Extra', start: '2026-12-01'}),
    ];
    const picked = pickHomeUpcomingEvents(events, now, 3);
    expect(picked.map((e) => e.title)).toEqual(['PTA Meeting', 'Carnival', 'Tour']);
  });
});
