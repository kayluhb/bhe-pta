import type { CalendarEvent } from "~/lib/types";

// ─── Category Colors ──────────────────────────────────────────────────────────

const categoryColors: Record<string, { bg: string; text: string }> = {
  "Community Event": { bg: "bg-cyan-100", text: "text-cyan-800" },
  "Fine Arts": { bg: "bg-pink-100", text: "text-pink-800" },
  "Student Holiday": { bg: "bg-amber-100", text: "text-amber-800" },
  Athletics: { bg: "bg-teal-100", text: "text-teal-800" },
};

function getCategoryColor(category: string) {
  return categoryColors[category] ?? { bg: "bg-gray-100", text: "text-gray-800" };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/** Parse "2026-02-14" or "2026-02-14T17:30:00" into { year, month (0-based), day } */
function parseDate(dateStr: string): { year: number; month: number; day: number } {
  const [datePart] = dateStr.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}

/** Get all dates an event spans, within a given month */
function getEventDaysInMonth(
  event: CalendarEvent,
  year: number,
  month: number
): number[] {
  const start = parseDate(event.start);
  const end = parseDate(event.end);

  const days: number[] = [];

  // For all-day multi-day events, the end date is exclusive
  const startDate = new Date(start.year, start.month, start.day);
  const endDate = event.allDay
    ? new Date(end.year, end.month, end.day)
    : new Date(end.year, end.month, end.day + 1);

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  const iterStart = startDate > monthStart ? startDate : monthStart;
  const iterEnd = endDate <= new Date(monthEnd.getTime() + 86400000) ? endDate : new Date(year, month + 1, 1);

  const current = new Date(iterStart);
  while (current < iterEnd) {
    if (current.getMonth() === month && current.getFullYear() === year) {
      days.push(current.getDate());
    }
    current.setDate(current.getDate() + 1);
  }

  return days;
}

// ─── Calendar Component ───────────────────────────────────────────────────────

interface CalendarProps {
  year: number;
  month: number; // 0-based
  events: CalendarEvent[];
  onEventClick?: (eventId: string) => void;
}

export function Calendar({ year, month, events, onEventClick }: CalendarProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Build a map: day -> events for that day
  const dayEventsMap = new Map<number, CalendarEvent[]>();
  for (const event of events) {
    const days = getEventDaysInMonth(event, year, month);
    for (const day of days) {
      const existing = dayEventsMap.get(day) ?? [];
      existing.push(event);
      dayEventsMap.set(day, existing);
    }
  }

  // Build grid cells
  const totalCells = firstDay + daysInMonth;
  const rows = Math.ceil(totalCells / 7);
  const cells: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }
  while (cells.length < rows * 7) {
    cells.push(null);
  }

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 bg-eagle-blue">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="py-2.5 text-center text-xs font-heading font-bold uppercase tracking-wider text-white/80"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 border-l border-t border-charcoal/10">
        {cells.map((day, idx) => {
          const dayEvents = day ? dayEventsMap.get(day) ?? [] : [];
          const isToday = isCurrentMonth && day === todayDate;

          return (
            <div
              key={idx}
              className={`min-h-[80px] md:min-h-[100px] border-r border-b border-charcoal/10 p-1.5 ${
                day === null ? "bg-charcoal/[0.02]" : "bg-white"
              }`}
            >
              {day !== null && (
                <>
                  <span
                    className={`inline-flex items-center justify-center text-sm font-heading font-semibold w-7 h-7 rounded-full ${
                      isToday
                        ? "bg-eagle-blue text-white"
                        : "text-charcoal/70"
                    }`}
                  >
                    {day}
                  </span>
                  <div className="mt-0.5 space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => {
                      const color = getCategoryColor(event.category);
                      return (
                        <button
                          key={event.id}
                          onClick={() => onEventClick?.(event.id)}
                          className={`w-full text-left text-[10px] md:text-xs leading-tight font-medium px-1.5 py-0.5 rounded truncate ${color.bg} ${color.text} hover:opacity-80 transition-opacity cursor-pointer`}
                          title={event.title}
                        >
                          {event.title}
                        </button>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-charcoal/40 px-1">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Category Legend ───────────────────────────────────────────────────────────

export function CategoryLegend() {
  return (
    <div className="flex flex-wrap gap-4">
      {Object.entries(categoryColors).map(([name, colors]) => (
        <div key={name} className="flex items-center gap-1.5">
          <span className={`inline-block w-3 h-3 rounded-full ${colors.bg}`} />
          <span className="text-xs text-charcoal/60 font-medium">{name}</span>
        </div>
      ))}
    </div>
  );
}
