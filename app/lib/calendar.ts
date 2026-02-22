import type {CalendarEvent} from './types';

/** Infer a category from the event title since the ICS feed lacks CATEGORIES. */
function inferCategory(title: string): string {
  const t = title.toLowerCase();

  // Student/Staff Holidays
  if (
    /holiday|break|spring break|winter break|fall break|staff development|pled day|bad weather/i.test(
      t,
    ) ||
    /student holiday|staff holiday|labor day|mlk day|martin luther king|presidents.?day|cesar chavez|indigenous|diwali/i.test(
      t,
    )
  ) {
    return 'Student Holiday';
  }

  // Fine Arts
  if (
    /fine arts|talent show|showcase|art|music|band|choir|play |drama|reflections|book fair|book character|author /i.test(
      t,
    )
  ) {
    return 'Fine Arts';
  }

  // Athletics
  if (
    /field day|track and field|running club|biking club|fit n.?fun|ninja|color run|walk.*school|bike.*school/i.test(
      t,
    )
  ) {
    return 'Athletics';
  }

  // Community Events
  if (
    /bash|carnival|movie night|spirit day|market day|meet the teacher|back to school|coffee talk|fling|beautification|park day|gardening|jingle bell|picture day|conference|campus tour|prospective parent|future families|pta |cac meeting|advisory council|thanksgiving lunch|pow wow|appreciation|sock drive|stem day|science fair|rodeo|100th day|bee kind|book voting|bluebonnet/i.test(
      t,
    )
  ) {
    return 'Community Event';
  }

  return 'Other';
}

/** Parse ICS date formats: 20260201, 20260214T173000, or 20260214T233000Z */
function parseIcsDate(d: string): string {
  const isUtc = d.endsWith('Z');
  const clean = d.replace(/Z$/, '');
  if (clean.length === 8) {
    return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
  }
  const iso = `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}T${clean.slice(9, 11)}:${clean.slice(11, 13)}:${clean.slice(13, 15)}`;
  return isUtc ? iso + 'Z' : iso;
}

/** Parse a raw ICS text string into CalendarEvent objects. */
function parseIcs(
  icsText: string,
  opts: {source?: 'school' | 'pta'; categoryFn?: (title: string) => string} = {},
): CalendarEvent[] {
  // RFC 5545 line folding: continuation is CRLF + space (or LF + space). Unfold so each logical line is one string.
  const unfolded = icsText.replace(/\r\n /g, '').replace(/\n /g, '');

  const events: CalendarEvent[] = [];
  const vevents = unfolded.split('BEGIN:VEVENT');

  for (let i = 1; i < vevents.length; i++) {
    const block = vevents[i].split('END:VEVENT')[0];

    const getValue = (key: string): string => {
      // Handle properties that may have parameters (e.g., DTSTART;VALUE=DATE:20260201)
      const regex = new RegExp(`^${key}[;:](.*)$`, 'm');
      const match = block.match(regex);
      if (!match) return '';
      // If there's a parameter separator, get value after the last colon
      const val = match[1];
      const colonIdx = val.lastIndexOf(':');
      return colonIdx >= 0 ? val.substring(colonIdx + 1).trim() : val.trim();
    };

    const summary = getValue('SUMMARY');
    const dtstart = getValue('DTSTART');
    const dtend = getValue('DTEND');
    const description = getValue('DESCRIPTION');
    const categories = getValue('CATEGORIES');
    const uid = getValue('UID');

    if (summary && dtstart) {
      const title = summary.replace(/\\,/g, ',').replace(/\\n/g, ' ');
      events.push({
        id: uid || `event-${i}`,
        title,
        start: parseIcsDate(dtstart),
        end: dtend ? parseIcsDate(dtend) : parseIcsDate(dtstart),
        allDay: dtstart.length === 8,
        category: categories || (opts.categoryFn ? opts.categoryFn(title) : inferCategory(title)),
        description:
          description
            ?.replace(/\\n/g, '\n')
            .replace(/\\,/g, ',')
            .replace(/^Body\s+/i, '') || undefined,
        source: opts.source,
      });
    }
  }

  return events;
}

/** Official Barton Hills Elementary school calendar (ICS). https://bartonhills.austinschools.org/events */
export const BARTON_HILLS_CALENDAR_ICS =
  'https://bartonhills.austinschools.org/events/calendar.ics';

/** BHE PTA Google Calendar public ICS feed. */
export const PTA_CALENDAR_ICS =
  'https://calendar.google.com/calendar/ical/pta%40bheeagles.com/public/basic.ics';

export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  const url = `${BARTON_HILLS_CALENDAR_ICS}?t=${Date.now()}`;
  const response = await fetch(url);
  const icsText = await response.text();
  return parseIcs(icsText, {source: 'school'});
}

export async function fetchPtaCalendarEvents(): Promise<CalendarEvent[]> {
  const url = `${PTA_CALENDAR_ICS}?t=${Date.now()}`;
  const response = await fetch(url);
  const icsText = await response.text();
  return parseIcs(icsText, {
    source: 'pta',
    categoryFn: () => 'Community Event',
  });
}
