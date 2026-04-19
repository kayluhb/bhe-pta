import {beforeEach, describe, expect, it, vi} from 'vitest';

import {
  BARTON_HILLS_CALENDAR_ICS,
  fetchCalendarEvents,
  fetchPtaCalendarEvents,
  PTA_CALENDAR_ICS,
} from '../calendar';

function icsForSchoolInfer() {
  return [
    'BEGIN:VCALENDAR',
    'BEGIN:VEVENT',
    'UID:u1',
    'SUMMARY:Winter Break Day',
    'DTSTART;VALUE=DATE:20260201',
    'DTEND;VALUE=DATE:20260202',
    'DESCRIPTION:Body note\\,comma',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'SUMMARY:Band Concert Night',
    'DTSTART:20260210T150000',
    'DTEND:20260210T160000',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'SUMMARY:Field Day Fun',
    'DTSTART;VALUE=DATE:20260211',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'SUMMARY:Spring Carnival',
    'DTSTART;VALUE=DATE:20260212',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'SUMMARY:Random Staff Meeting',
    'DTSTART;VALUE=DATE:20260213',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'SUMMARY:Wrapped',
    'DTSTART:20260214T233000Z',
    'DTEND:20260215T003000Z',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'SUMMARY:Folded Description',
    'DTSTART;VALUE=DATE:20260215',
    'DESCRIPTION:Line one\\n more text',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

describe('calendar', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exports ICS URLs', () => {
    expect(BARTON_HILLS_CALENDAR_ICS).toContain('calendar.ics');
    expect(PTA_CALENDAR_ICS).toContain('calendar/ical');
  });

  it('fetchCalendarEvents parses ICS from fetch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        text: async () => icsForSchoolInfer(),
      }),
    );
    const events = await fetchCalendarEvents();
    expect(events.length).toBeGreaterThan(0);
    expect(events.every((e) => e.source === 'school')).toBe(true);
    const winter = events.find((e) => e.title.includes('Winter'));
    expect(winter?.category).toBe('Student Holiday');
    vi.unstubAllGlobals();
  });

  it('fetchPtaCalendarEvents tags PTA source and category', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        text: async () =>
          [
            'BEGIN:VCALENDAR',
            'BEGIN:VEVENT',
            'SUMMARY:PTA Bash',
            'DTSTART;VALUE=DATE:20260301',
            'END:VEVENT',
            'END:VCALENDAR',
          ].join('\n'),
      }),
    );
    const events = await fetchPtaCalendarEvents();
    expect(events[0]?.source).toBe('pta');
    expect(events[0]?.category).toBe('Community Event');
    vi.unstubAllGlobals();
  });
});
