import { useState, useCallback, useRef } from "react";
import { useLoaderData } from "react-router";
import type { Route } from "./+types/events";
import { mockEvents } from "~/lib/mock-data";
import type { CalendarEvent } from "~/lib/types";
import { Calendar, CategoryLegend } from "~/components/Calendar";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Events Calendar — Barton Hills Elementary PTA" },
    {
      name: "description",
      content:
        "View upcoming events, meetings, and activities at Barton Hills Elementary. Community events, fine arts, holidays, and more.",
    },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  let events = mockEvents;

  try {
    const kvEvents = await context.cloudflare.env.BHE_CALENDAR.get(
      "events",
      "json"
    );
    if (kvEvents) events = kvEvents as typeof events;
  } catch {
    // KV not available — use mock data
  }

  return { events };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  "Community Event": {
    bg: "bg-cyan-50",
    text: "text-cyan-800",
    border: "border-cyan-200",
  },
  "Fine Arts": {
    bg: "bg-pink-50",
    text: "text-pink-800",
    border: "border-pink-200",
  },
  "Student Holiday": {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
  },
  Athletics: {
    bg: "bg-teal-50",
    text: "text-teal-800",
    border: "border-teal-200",
  },
};

function getCategoryStyle(category: string) {
  return (
    categoryColors[category] ?? {
      bg: "bg-gray-50",
      text: "text-gray-800",
      border: "border-gray-200",
    }
  );
}

function parseEventDate(dateStr: string): Date {
  if (dateStr.includes("T")) {
    return new Date(dateStr);
  }
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatEventTime(dateStr: string): string | null {
  if (!dateStr.includes("T")) return null;
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatEventDateRange(event: CalendarEvent): string {
  const start = parseEventDate(event.start);
  const end = parseEventDate(event.end);

  const startStr = start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  if (event.allDay) {
    // Multi-day all-day event
    const endDisplay = new Date(end.getTime() - 86400000); // end is exclusive
    if (endDisplay.getTime() > start.getTime()) {
      const endStr = endDisplay.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
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
function eventInMonth(
  event: CalendarEvent,
  year: number,
  month: number
): boolean {
  const start = parseEventDate(event.start);
  const end = parseEventDate(event.end);

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

  return start <= monthEnd && end >= monthStart;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Events() {
  const { events } = useLoaderData<typeof loader>();
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const eventListRef = useRef<HTMLDivElement>(null);

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
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  }, []);

  const monthEvents = events
    .filter((e) => eventInMonth(e, currentYear, currentMonth))
    .sort(
      (a, b) =>
        parseEventDate(a.start).getTime() - parseEventDate(b.start).getTime()
    );

  const handleEventClick = useCallback((eventId: string) => {
    const el = document.getElementById(`event-${eventId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-spirit-gold");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-spirit-gold");
      }, 2000);
    }
  }, []);

  return (
    <main>
      {/* ── Page Banner ──────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-eagle-blue to-night-blue py-16 md:py-24 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, transparent, transparent 60px, #d4a843 60px, #d4a843 62px)",
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white">
            Events Calendar
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
            Stay up to date with everything happening at Barton Hills
          </p>
          <div className="mt-6 h-1 w-20 bg-spirit-gold rounded-full mx-auto" />
        </div>
      </section>

      {/* ── Calendar Section ──────────────────────────────────────────────── */}
      <section className="bg-warm-white py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={goToPrevMonth}
              className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-md border border-charcoal/10 text-charcoal/60 hover:text-eagle-blue hover:border-eagle-blue transition-colors cursor-pointer"
              aria-label="Previous month"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </button>

            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-charcoal">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h2>
              <button
                onClick={goToToday}
                className="mt-1 text-xs font-heading font-semibold text-eagle-blue hover:text-spirit-gold transition-colors cursor-pointer"
              >
                Today
              </button>
            </div>

            <button
              onClick={goToNextMonth}
              className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-md border border-charcoal/10 text-charcoal/60 hover:text-eagle-blue hover:border-eagle-blue transition-colors cursor-pointer"
              aria-label="Next month"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>
          </div>

          {/* Category Legend */}
          <div className="mb-6">
            <CategoryLegend />
          </div>

          {/* Calendar Grid */}
          <Calendar
            year={currentYear}
            month={currentMonth}
            events={events}
            onEventClick={handleEventClick}
          />
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

          {monthEvents.length === 0 ? (
            <p className="text-center text-charcoal/50 py-12 text-lg">
              No events scheduled for {MONTH_NAMES[currentMonth]} {currentYear}.
            </p>
          ) : (
            <div className="space-y-5">
              {monthEvents.map((event) => (
                <EventListItem key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

// ─── Event List Item ──────────────────────────────────────────────────────────

function EventListItem({ event }: { event: CalendarEvent }) {
  const startDate = parseEventDate(event.start);
  const monthShort = startDate.toLocaleDateString("en-US", { month: "short" });
  const dayNum = startDate.getDate().toString();
  const style = getCategoryStyle(event.category);

  return (
    <article
      id={`event-${event.id}`}
      className="group flex bg-white rounded-lg shadow-md border-l-4 border-spirit-gold overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
    >
      {/* Date Badge */}
      <div className="flex flex-col items-center justify-center bg-eagle-blue text-white px-4 py-4 min-w-[72px]">
        <span className="text-xs font-heading font-bold uppercase tracking-wider text-spirit-gold">
          {monthShort}
        </span>
        <span className="text-2xl font-heading font-bold leading-tight">
          {dayNum}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="font-heading font-bold text-charcoal text-base group-hover:text-eagle-blue transition-colors">
            {event.title}
          </h3>
          <span
            className={`text-[10px] font-heading font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}
          >
            {event.category}
          </span>
        </div>

        <p className="text-sm text-charcoal/50 font-medium">
          {formatEventDateRange(event)}
        </p>

        {event.description && (
          <p className="mt-1.5 text-sm text-charcoal/60 leading-relaxed">
            {event.description}
          </p>
        )}
      </div>
    </article>
  );
}
