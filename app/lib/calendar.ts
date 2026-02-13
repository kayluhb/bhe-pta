import type { CalendarEvent } from "./types";

/** Official Barton Hills Elementary school calendar (ICS). https://bartonhills.austinschools.org/events */
export const BARTON_HILLS_CALENDAR_ICS =
  "https://bartonhills.austinschools.org/events/calendar.ics";

export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  const url = `${BARTON_HILLS_CALENDAR_ICS}?t=${Date.now()}`;
  const response = await fetch(url);
  let icsText = await response.text();

  // RFC 5545 line folding: continuation is CRLF + space (or LF + space). Unfold so each logical line is one string.
  icsText = icsText.replace(/\r\n /g, "").replace(/\n /g, "");

  // Parse ICS format manually (simpler than ical.js for our needs). RRULE not expanded — one instance per VEVENT.
  const events: CalendarEvent[] = [];
  const vevents = icsText.split("BEGIN:VEVENT");

  for (let i = 1; i < vevents.length; i++) {
    const block = vevents[i].split("END:VEVENT")[0];

    const getValue = (key: string): string => {
      // Handle properties that may have parameters (e.g., DTSTART;VALUE=DATE:20260201)
      const regex = new RegExp(`^${key}[;:](.*)$`, "m");
      const match = block.match(regex);
      if (!match) return "";
      // If there's a parameter separator, get value after the last colon
      const val = match[1];
      const colonIdx = val.lastIndexOf(":");
      return colonIdx >= 0 ? val.substring(colonIdx + 1).trim() : val.trim();
    };

    const summary = getValue("SUMMARY");
    const dtstart = getValue("DTSTART");
    const dtend = getValue("DTEND");
    const description = getValue("DESCRIPTION");
    const categories = getValue("CATEGORIES");
    const uid = getValue("UID");

    if (summary && dtstart) {
      // Parse ICS date formats: 20260201 or 20260214T173000
      const parseIcsDate = (d: string): string => {
        if (d.length === 8) {
          return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
        }
        return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${d.slice(9, 11)}:${d.slice(11, 13)}:${d.slice(13, 15)}`;
      };

      events.push({
        id: uid || `event-${i}`,
        title: summary.replace(/\\,/g, ",").replace(/\\n/g, " "),
        start: parseIcsDate(dtstart),
        end: dtend ? parseIcsDate(dtend) : parseIcsDate(dtstart),
        allDay: dtstart.length === 8,
        category: categories || "Other",
        description:
          description?.replace(/\\n/g, "\n").replace(/\\,/g, ",") || undefined,
      });
    }
  }

  return events;
}
