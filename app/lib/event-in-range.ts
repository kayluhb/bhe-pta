import type {CalendarEvent} from './types';

function parseDate(dateStr: string): {year: number; month: number; day: number} {
  const [datePart] = dateStr.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  return {year: y, month: m - 1, day: d};
}

function eventStartDate(event: CalendarEvent): Date {
  const start = parseDate(event.start);
  return new Date(start.year, start.month, start.day);
}

function eventLastDate(event: CalendarEvent): Date {
  const end = parseDate(event.end);
  if (event.allDay) {
    const last = new Date(end.year, end.month, end.day);
    last.setDate(last.getDate() - 1);
    return last;
  }
  return new Date(end.year, end.month, end.day);
}

/** True if the event overlaps any day of the 7-day week starting at `weekStart`. */
export function eventInWeek(event: CalendarEvent, weekStart: Date): boolean {
  const start = eventStartDate(event);
  const end = eventLastDate(event);
  const weekBegin = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
  const weekEnd = new Date(weekBegin);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return start <= weekEnd && end >= weekBegin;
}
