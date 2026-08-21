import {useCallback, useRef, useState} from 'react';
import {useLoaderData} from 'react-router';
import {Calendar, CategoryLegend, getEventDaysInMonth, WeekCalendar} from '~/components/Calendar';
import {sanitizeCalendarEvents} from '~/lib/calendar';
import {getCloudflare} from '~/lib/cloudflare-context';
import {mergeParentMeta} from '~/lib/meta';
import type {CalendarEvent} from '~/lib/types';
import type {Route} from './+types/events';

export function meta({matches}: Route.MetaArgs) {
  return mergeParentMeta(matches, [
    {title: 'Events Calendar | Barton Hills Elementary PTA'},
    {
      name: 'description',
      content:
        'View upcoming events, PTA meetings, spirit nights, and school activities at Barton Hills Elementary.',
    },
  ]);
}

export async function loader({context}: Route.LoaderArgs) {
  let events: CalendarEvent[] = [];

  try {
    const kvEvents = await getCloudflare(context).env.BHE_CALENDAR.get('events', 'json');
    if (kvEvents) events = sanitizeCalendarEvents(kvEvents as CalendarEvent[]);
  } catch {
    // KV not available — show empty; all events come from school calendar ICS
  }

  return {events};
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const categoryColors: Record<string, {bg: string; text: string; border: string}> = {
  'Community Event': {
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
  },
  'Fine Arts': {
    bg: 'bg-pink-50',
    text: 'text-pink-800',
    border: 'border-pink-200',
  },
  'Student Holiday': {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  Athletics: {
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
  },
};

function getCategoryStyle(category: string) {
  return (
    categoryColors[category] ?? {
      bg: 'bg-gray-50',
      text: 'text-gray-800',
      border: 'border-gray-200',
    }
  );
}

const CT = 'America/Chicago';

function parseEventDate(dateStr: string): Date {
  if (dateStr.includes('T')) {
    // Treat naive datetime strings as Central Time
    return dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr)
      ? new Date(dateStr)
      : new Date(`${dateStr}-06:00`);
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  // Use UTC noon so that timeZone formatting never shifts to the wrong date
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

function formatEventTime(dateStr: string): string | null {
  if (!dateStr.includes('T')) return null;
  const date = parseEventDate(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: CT,
  });
}

function formatEventDateRange(event: CalendarEvent): string {
  const start = parseEventDate(event.start);
  const end = parseEventDate(event.end);

  const dateFormatOpts: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: CT,
  };
  const startStr = start.toLocaleDateString('en-US', dateFormatOpts);

  if (event.allDay) {
    // Multi-day all-day event
    const endDisplay = new Date(end.getTime() - 86400000); // end is exclusive
    if (endDisplay.getTime() > start.getTime()) {
      const endStr = endDisplay.toLocaleDateString('en-US', dateFormatOpts);
      return `${startStr} — ${endStr}`;
    }
    return startStr;
  }

  const startTime = formatEventTime(event.start);
  const endTime = formatEventTime(event.end);
  if (startTime && endTime) {
    return `${startStr}, ${startTime} – ${endTime}`;
  }
  return startStr;
}

/** Check whether an event falls within the given month/year */
function eventInMonth(event: CalendarEvent, year: number, month: number): boolean {
  const start = parseEventDate(event.start);
  let end = parseEventDate(event.end);

  // For all-day events, end date is exclusive — use last actual day
  if (event.allDay) {
    end = new Date(end.getTime() - 86400000);
  }

  // Use UTC noon to match parseEventDate
  const monthStart = new Date(Date.UTC(year, month, 1, 12, 0, 0));
  const monthEnd = new Date(Date.UTC(year, month + 1, 0, 12, 0, 0));

  return start <= monthEnd && end >= monthStart;
}

/** True if event is all-day and spans every day of the given month (show above calendar). */
function isMonthLongEvent(event: CalendarEvent, year: number, month: number): boolean {
  if (!event.allDay) return false;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = getEventDaysInMonth(event, year, month);
  return days.length >= daysInMonth;
}

function getWeekStartCT(): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CT,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now);
  const y = Number(parts.find((p) => p.type === 'year')?.value ?? '0');
  const m = Number(parts.find((p) => p.type === 'month')?.value ?? '1') - 1;
  const d = Number(parts.find((p) => p.type === 'day')?.value ?? '1');
  const today = new Date(y, m, d);
  today.setDate(today.getDate() - today.getDay());
  return today;
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const startStr = weekStart.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${startStr} – ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
  }
  const endStr = weekEnd.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
  return `${startStr} – ${endStr}, ${weekEnd.getFullYear()}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Events() {
  const {events} = useLoaderData<typeof loader>();

  // Use CT-aware date parts so server (UTC) and client agree on the current month
  const now = new Date();
  const nowCT = new Intl.DateTimeFormat('en-US', {
    timeZone: CT,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(now);
  const initYear = Number(nowCT.find((p) => p.type === 'year')?.value ?? '0');
  const initMonth = Number(nowCT.find((p) => p.type === 'month')?.value ?? '1') - 1;
  const [currentYear, setCurrentYear] = useState(initYear);
  const [currentMonth, setCurrentMonth] = useState(initMonth);
  const eventListRef = useRef<HTMLDivElement>(null);
  const [weekStart, setWeekStart] = useState(() => getWeekStartCT());

  const goToPrevWeek = useCallback(() => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }, []);

  const goToNextWeek = useCallback(() => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }, []);

  const goToThisWeek = useCallback(() => {
    setWeekStart(getWeekStartCT());
  }, []);

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((m) => {
      if (m === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((m) => {
      if (m === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const goToToday = useCallback(() => {
    const today = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: CT,
      year: 'numeric',
      month: 'numeric',
    }).formatToParts(today);
    setCurrentYear(Number(parts.find((p) => p.type === 'year')?.value ?? '0'));
    setCurrentMonth(Number(parts.find((p) => p.type === 'month')?.value ?? '1') - 1);
  }, []);

  const monthEvents = events
    .filter((e) => eventInMonth(e, currentYear, currentMonth))
    .sort((a, b) => parseEventDate(a.start).getTime() - parseEventDate(b.start).getTime());

  const monthLongEvents = monthEvents.filter((e) => isMonthLongEvent(e, currentYear, currentMonth));
  const calendarAndListEvents = monthEvents.filter(
    (e) => !isMonthLongEvent(e, currentYear, currentMonth),
  );

  const handleEventClick = useCallback((eventId: string) => {
    const el = document.getElementById(`event-${eventId}`);
    if (el) {
      el.scrollIntoView({behavior: 'smooth', block: 'center'});
      el.classList.add('ring-2', 'ring-spirit-gold');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-spirit-gold');
      }, 2000);
    }
  }, []);

  return (
    <div>
      {/* ── Page Banner ──────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-eagle-blue to-night-blue py-16 md:py-24 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, transparent, transparent 60px, #d4a843 60px, #d4a843 62px)',
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white">
            Events Calendar
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Stay up to date with everything happening at Barton Hills
          </p>
          <div className="mt-6 h-1 w-20 bg-spirit-gold rounded-full mx-auto" />
        </div>
      </section>

      {/* ── Calendar Section ──────────────────────────────────────────────── */}
      <section className="bg-warm-white py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4">
          {/* ─── Mobile: Week View ─── */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-6">
              <button
                aria-label="Previous week"
                className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-md border border-charcoal/10 text-charcoal/70 hover:text-eagle-blue hover:border-eagle-blue transition-colors cursor-pointer"
                onClick={goToPrevWeek}
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div className="text-center">
                <h2 className="text-xl font-heading font-bold text-charcoal">
                  {formatWeekRange(weekStart)}
                </h2>
                <button
                  className="mt-1 text-xs font-heading font-semibold text-eagle-blue hover:text-spirit-gold transition-colors cursor-pointer"
                  onClick={goToThisWeek}
                  type="button"
                >
                  This Week
                </button>
              </div>

              <button
                aria-label="Next week"
                className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-md border border-charcoal/10 text-charcoal/70 hover:text-eagle-blue hover:border-eagle-blue transition-colors cursor-pointer"
                onClick={goToNextWeek}
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <CategoryLegend />
            </div>

            <WeekCalendar events={events} onEventClick={handleEventClick} weekStart={weekStart} />
          </div>

          {/* ─── Desktop: Month View ─── */}
          {/* Month Navigation */}
          <div className="hidden md:flex items-center justify-between mb-8">
            <button
              aria-label="Previous month"
              className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-md border border-charcoal/10 text-charcoal/70 hover:text-eagle-blue hover:border-eagle-blue transition-colors cursor-pointer"
              onClick={goToPrevMonth}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div aria-atomic="true" aria-live="polite" className="text-center">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-charcoal">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h2>
              <button
                className="mt-1 text-xs font-heading font-semibold text-eagle-blue hover:text-spirit-gold transition-colors cursor-pointer"
                onClick={goToToday}
                type="button"
              >
                Today
              </button>
            </div>

            <button
              aria-label="Next month"
              className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-md border border-charcoal/10 text-charcoal/70 hover:text-eagle-blue hover:border-eagle-blue transition-colors cursor-pointer"
              onClick={goToNextMonth}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M8.25 4.5l7.5 7.5-7.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Category Legend */}
          <div className="mb-6 hidden md:block">
            <CategoryLegend />
          </div>

          {/* Month-long events (all-day events spanning the full month) */}
          {monthLongEvents.length > 0 && (
            <div className="mb-6 space-y-2">
              {monthLongEvents.map((event) => {
                const style = getCategoryStyle(event.category);
                return (
                  <div
                    className={`hidden md:flex items-center gap-3 rounded-lg border px-4 py-3 ${style.bg} ${style.border}`}
                    id={`event-${event.id}`}
                    key={event.id}
                  >
                    <span
                      className={`text-xs font-heading font-semibold uppercase tracking-wider ${style.text}`}
                    >
                      {event.category}
                    </span>
                    <span className="font-heading font-bold text-charcoal">{event.title}</span>
                    <span className="text-sm text-charcoal/70">{formatEventDateRange(event)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Calendar Grid */}
          <div className="hidden md:block">
            <Calendar
              events={calendarAndListEvents}
              month={currentMonth}
              onEventClick={handleEventClick}
              year={currentYear}
            />
          </div>

          {/* Subscribe links */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
            <a
              className="inline-flex items-center gap-2 text-sm font-heading font-semibold text-eagle-blue hover:text-spirit-gold transition-colors"
              href="https://calendar.google.com/calendar/render?cid=http%3A%2F%2Fbartonhills.austinschools.org%2Fevents%2Fcalendar.ics"
              rel="noopener noreferrer"
              target="_blank"
            >
              Subscribe to School Calendar
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="sr-only">(opens in new tab)</span>
            </a>
            <a
              className="inline-flex items-center gap-2 text-sm font-heading font-semibold text-eagle-blue hover:text-spirit-gold transition-colors"
              href="https://calendar.google.com/calendar/render?cid=pta%40bheeagles.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              Subscribe to PTA Calendar
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="sr-only">(opens in new tab)</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── Events List ──────────────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-24" ref={eventListRef}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal">
              {MONTH_NAMES[currentMonth]} Events
            </h2>
            <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full" />
          </div>

          {calendarAndListEvents.length === 0 && monthLongEvents.length === 0 ? (
            <p className="text-center text-charcoal/70 py-12 text-lg">
              No events scheduled for {MONTH_NAMES[currentMonth]} {currentYear}.
            </p>
          ) : (
            <div className="space-y-5">
              {calendarAndListEvents.map((event) => (
                <EventListItem event={event} key={event.id} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ─── Event List Item ──────────────────────────────────────────────────────────

function EventListItem({event}: {event: CalendarEvent}) {
  const startDate = parseEventDate(event.start);
  const monthShort = startDate.toLocaleDateString('en-US', {month: 'short', timeZone: CT});
  const dayNum = Number(
    startDate.toLocaleDateString('en-US', {day: 'numeric', timeZone: CT}),
  ).toString();
  const style = getCategoryStyle(event.category);

  return (
    <article
      className="flex items-center overflow-hidden rounded-lg bg-white shadow-md"
      id={`event-${event.id}`}
    >
      {/* Date Badge */}
      <div className="flex flex-col items-center justify-center bg-white text-creek-green px-4 py-4 min-w-[72px]">
        <span className="text-xs font-heading font-bold uppercase tracking-wider text-creek-green/70">
          {monthShort}
        </span>
        <span className="text-2xl font-heading font-bold leading-tight">{dayNum}</span>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="font-heading text-base font-bold text-charcoal">
            {event.title}
          </h3>
          <span
            className={`text-[10px] font-heading font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}
          >
            {event.category}
          </span>
        </div>

        <p className="text-sm text-charcoal/70 font-medium">{formatEventDateRange(event)}</p>

        {event.description && (
          <p className="mt-1.5 text-sm text-charcoal/70 leading-relaxed">{event.description}</p>
        )}
      </div>
    </article>
  );
}
