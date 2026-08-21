import {beforeEach, describe, expect, it, vi} from 'vitest';

import {
  BARTON_HILLS_CALENDAR_ICS,
  fetchCalendarEvents,
  fetchPtaCalendarEvents,
  PTA_CALENDAR_ICS,
  sanitizeEventDescription,
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

  it('preserves DESCRIPTION URLs that contain colons', async () => {
    const description =
      'Body \\n\\nNational Hispanic Heritage Month\\n[https://www.hispanicheritagemonth.gov/]\\n\\n2026-2027 AISD Staff Recognition Calendar - Google Docs\\n[https://docs.google.com/document/d/1AAJzwV5Gg5XesLyaemtxMrcb0DX8sLYxTFC2Cc7JE_I/edit?tab=t.0]';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        text: async () =>
          [
            'BEGIN:VCALENDAR',
            'BEGIN:VEVENT',
            'SUMMARY:AISD: National Hispanic Heritage Month',
            'DTSTART;VALUE=DATE:20260901',
            'DTEND;VALUE=DATE:20261001',
            `DESCRIPTION:${description}`,
            'END:VEVENT',
            'END:VCALENDAR',
          ].join('\r\n'),
      }),
    );
    const events = await fetchCalendarEvents();
    expect(events[0]?.description).toBe('National Hispanic Heritage Month');
    expect(events[0]?.description).not.toContain('docs.google.com');
    vi.unstubAllGlobals();
  });
});

describe('sanitizeEventDescription', () => {
  it('keeps the first meaningful line and strips URLs', () => {
    expect(
      sanitizeEventDescription(
        'Body \n\nNational Hispanic Heritage Month\n[https://docs.google.com/document/d/abc]\nMore',
      ),
    ).toBe('National Hispanic Heritage Month');
  });

  it('returns undefined when only links remain', () => {
    expect(sanitizeEventDescription('[https://example.com/a]')).toBeUndefined();
  });

  it('drops already-mangled protocol-relative Google Docs leftovers', () => {
    expect(
      sanitizeEventDescription(
        '//docs.google.com/document/d/1AAJzwV5Gg5XesLyaemtxMrcb0DX8sLYxTFC2Cc7JE_I/edit?tab=t.0]',
      ),
    ).toBeUndefined();
  });
});
