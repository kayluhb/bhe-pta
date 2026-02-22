import type {CalendarEvent} from '~/lib/types';

// ─── Category Colors ──────────────────────────────────────────────────────────

const categoryColors: Record<string, {bg: string; text: string; barBg: string; barText: string}> = {
  'Community Event': {
    bg: 'bg-cyan-100',
    text: 'text-cyan-800',
    barBg: 'bg-cyan-600',
    barText: 'text-white',
  },
  'Fine Arts': {
    bg: 'bg-pink-100',
    text: 'text-pink-800',
    barBg: 'bg-pink-600',
    barText: 'text-white',
  },
  'Student Holiday': {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    barBg: 'bg-amber-500',
    barText: 'text-white',
  },
  Athletics: {
    bg: 'bg-teal-100',
    text: 'text-teal-800',
    barBg: 'bg-teal-600',
    barText: 'text-white',
  },
};

const defaultColor = {
  bg: 'bg-slate-100',
  text: 'text-slate-700',
  barBg: 'bg-slate-500',
  barText: 'text-white',
};

function getCategoryColor(category: string) {
  return categoryColors[category] ?? defaultColor;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/** Parse "2026-02-14" or "2026-02-14T17:30:00" into { year, month (0-based), day } */
function parseDate(dateStr: string): {year: number; month: number; day: number} {
  const [datePart] = dateStr.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  return {year: y, month: m - 1, day: d};
}

/** Get all dates an event spans, within a given month. Exported for use on events page. */
export function getEventDaysInMonth(event: CalendarEvent, year: number, month: number): number[] {
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
  const iterEnd =
    endDate <= new Date(monthEnd.getTime() + 86400000) ? endDate : new Date(year, month + 1, 1);

  const current = new Date(iterStart);
  while (current < iterEnd) {
    if (current.getMonth() === month && current.getFullYear() === year) {
      days.push(current.getDate());
    }
    current.setDate(current.getDate() + 1);
  }

  return days;
}

// ─── Multi-Day Event Segmentation ─────────────────────────────────────────────

interface EventSegment {
  event: CalendarEvent;
  startCol: number; // 0-6, column in the week grid
  spanCols: number; // how many columns to span
  isStart: boolean; // true = event's actual start (rounded left)
  isEnd: boolean; // true = event's actual end (rounded right)
  layer: number; // vertical stacking order (0 = top)
}

/** Get the actual last day of an event as a Date (handling exclusive end for allDay events). */
function getEventLastDate(event: CalendarEvent): Date {
  const end = parseDate(event.end);
  if (event.allDay) {
    // allDay end is exclusive, so last day is end - 1
    const d = new Date(end.year, end.month, end.day);
    d.setDate(d.getDate() - 1);
    return d;
  }
  return new Date(end.year, end.month, end.day);
}

function computeWeekSegments(
  multiDayEvents: {event: CalendarEvent; days: number[]}[],
  weekDays: (number | null)[],
  year: number,
  month: number,
): EventSegment[] {
  const segments: EventSegment[] = [];

  for (const {event, days: eventDays} of multiDayEvents) {
    // Find which columns in this week the event occupies
    const cols: number[] = [];
    for (let col = 0; col < 7; col++) {
      const day = weekDays[col];
      if (day !== null && eventDays.includes(day)) {
        cols.push(col);
      }
    }
    if (cols.length === 0) continue;

    const startCol = Math.min(...cols);
    const endCol = Math.max(...cols);
    const spanCols = endCol - startCol + 1;

    // Check if segment edges are the event's actual start/end
    const eventStartDate = parseDate(event.start);
    const actualStart = new Date(eventStartDate.year, eventStartDate.month, eventStartDate.day);
    const actualEnd = getEventLastDate(event);

    const segStartDate = new Date(year, month, weekDays[startCol]!);
    const segEndDate = new Date(year, month, weekDays[endCol]!);

    const isStart = segStartDate.getTime() === actualStart.getTime();
    const isEnd = segEndDate.getTime() === actualEnd.getTime();

    segments.push({event, startCol, spanCols, isStart, isEnd, layer: 0});
  }

  // Assign layers greedily — each segment gets the lowest non-overlapping layer
  segments.sort((a, b) => a.startCol - b.startCol || a.event.title.localeCompare(b.event.title));
  const assigned: EventSegment[] = [];
  for (const segment of segments) {
    let layer = 0;
    while (
      assigned.some(
        (other) =>
          other.layer === layer &&
          other.startCol < segment.startCol + segment.spanCols &&
          other.startCol + other.spanCols > segment.startCol,
      )
    ) {
      layer++;
    }
    segment.layer = layer;
    assigned.push(segment);
  }

  return segments;
}

// ─── Calendar Component ───────────────────────────────────────────────────────

const MAX_SPANNING_LAYERS = 3;

interface CalendarProps {
  year: number;
  month: number; // 0-based
  events: CalendarEvent[];
  onEventClick?: (eventId: string) => void;
}

const DAY_NAMES_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
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

export function Calendar({year, month, events, onEventClick}: CalendarProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Build grid cells padded to full weeks
  const totalCells = firstDay + daysInMonth;
  const rows = Math.ceil(totalCells / 7);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length < rows * 7) cells.push(null);

  // Chunk into week rows
  const weekRows: (number | null)[][] = [];
  for (let r = 0; r < rows; r++) {
    weekRows.push(cells.slice(r * 7, r * 7 + 7));
  }

  // Classify events: multi-day (spanning bars) vs single-day (badges)
  const multiDayEntries: {event: CalendarEvent; days: number[]}[] = [];
  const multiDayEventIds = new Set<string>();

  for (const event of events) {
    const days = getEventDaysInMonth(event, year, month);
    if (days.length > 1) {
      multiDayEntries.push({event, days});
      multiDayEventIds.add(event.id);
    }
  }

  // Build single-day events map (excluding multi-day events)
  const singleDayMap = new Map<number, CalendarEvent[]>();
  for (const event of events) {
    if (multiDayEventIds.has(event.id)) continue;
    const days = getEventDaysInMonth(event, year, month);
    for (const day of days) {
      const existing = singleDayMap.get(day) ?? [];
      existing.push(event);
      singleDayMap.set(day, existing);
    }
  }

  // Compute segments for each week
  const weekSegments = weekRows.map((weekDays) =>
    computeWeekSegments(multiDayEntries, weekDays, year, month),
  );

  // Use CT-consistent date so server (UTC) and client agree on "today"
  const today = new Date();
  const todayParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(today);
  const todayYear = Number(todayParts.find((p) => p.type === 'year')!.value);
  const todayMonth = Number(todayParts.find((p) => p.type === 'month')!.value) - 1;
  const todayDate = Number(todayParts.find((p) => p.type === 'day')!.value);
  const isCurrentMonth = todayYear === year && todayMonth === month;

  return (
    <div
      aria-label={`${MONTH_NAMES[month]} ${year} calendar`}
      className="bg-white rounded-lg shadow-md overflow-hidden"
      role="grid"
    >
      {/* Day headers */}
      <div className="grid grid-cols-7 bg-eagle-blue" role="row">
        {DAY_NAMES.map((name, i) => (
          <div
            aria-label={DAY_NAMES_FULL[i]}
            className="py-2.5 text-center text-xs font-heading font-bold uppercase tracking-wider text-white/90"
            key={name}
            role="columnheader"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Week rows */}
      <div className="border-l border-t border-charcoal/10">
        {weekRows.map((weekDays, weekIdx) => {
          const segments = weekSegments[weekIdx];
          const maxLayer = segments.length > 0 ? Math.max(...segments.map((s) => s.layer)) : -1;
          const layerCount = Math.min(MAX_SPANNING_LAYERS, maxLayer + 1);
          const visibleSegments = segments.filter((s) => s.layer < MAX_SPANNING_LAYERS);

          // Count hidden spanning events per day for "+N more"
          const hiddenPerDay = new Map<number, number>();
          for (const seg of segments) {
            if (seg.layer >= MAX_SPANNING_LAYERS) {
              for (let c = seg.startCol; c < seg.startCol + seg.spanCols; c++) {
                const day = weekDays[c];
                if (day !== null) {
                  hiddenPerDay.set(day, (hiddenPerDay.get(day) ?? 0) + 1);
                }
              }
            }
          }

          return (
            <div key={weekIdx}>
              {/* Spanning event bars */}
              {layerCount > 0 && (
                <div className="px-0.5 pt-1 pb-0.5 space-y-0.5 border-b border-charcoal/5">
                  {Array.from({length: layerCount}, (_, layerIdx) => (
                    <div className="grid grid-cols-7 h-5 md:h-6" key={layerIdx}>
                      {visibleSegments
                        .filter((s) => s.layer === layerIdx)
                        .map((segment) => {
                          const color = getCategoryColor(segment.event.category);
                          const roundedL = segment.isStart ? 'rounded-l-md ml-0.5' : '';
                          const roundedR = segment.isEnd ? 'rounded-r-md mr-0.5' : '';

                          return (
                            <button
                              aria-label={segment.event.title}
                              className={`${color.barBg} ${color.barText} text-[10px] md:text-xs font-semibold truncate px-1 md:px-2 h-5 md:h-6 leading-5 md:leading-6 hover:brightness-110 transition cursor-pointer shadow-sm ${roundedL} ${roundedR}`}
                              key={segment.event.id}
                              onClick={() => onEventClick?.(segment.event.id)}
                              style={{
                                gridColumn: `${segment.startCol + 1} / span ${segment.spanCols}`,
                              }}
                              title={segment.event.title}
                            >
                              {segment.event.title}
                            </button>
                          );
                        })}
                    </div>
                  ))}
                </div>
              )}

              {/* Day cells */}
              <div className="grid grid-cols-7" role="row">
                {weekDays.map((day, col) => {
                  const dayEvents = day ? (singleDayMap.get(day) ?? []) : [];
                  const isToday = isCurrentMonth && day === todayDate;
                  const hiddenSpanning = day ? (hiddenPerDay.get(day) ?? 0) : 0;
                  const fullDate =
                    day !== null ? `${MONTH_NAMES[month]} ${day}, ${year}` : undefined;

                  return (
                    <div
                      aria-label={fullDate}
                      className={`min-h-[48px] md:min-h-[80px] border-r border-b border-charcoal/10 p-1 md:p-1.5 ${
                        day === null ? 'bg-charcoal/[0.02]' : 'bg-white'
                      }`}
                      key={col}
                      role="gridcell"
                    >
                      {day !== null && (
                        <>
                          <span
                            className={`inline-flex items-center justify-center text-xs md:text-sm font-heading font-semibold w-6 h-6 md:w-7 md:h-7 rounded-full ${
                              isToday ? 'bg-eagle-blue text-white' : 'text-charcoal/70'
                            }`}
                          >
                            {day}
                          </span>
                          {/* Mobile: colored dots */}
                          {dayEvents.length > 0 && (
                            <div className="flex flex-wrap gap-0.5 mt-0.5 md:hidden justify-center">
                              {dayEvents.slice(0, 4).map((event) => {
                                const color = getCategoryColor(event.category);
                                return (
                                  <button
                                    aria-label={`${event.title} on ${fullDate}`}
                                    className={`w-2 h-2 rounded-full ${color.barBg} hover:opacity-80 transition-opacity cursor-pointer`}
                                    key={event.id}
                                    onClick={() => onEventClick?.(event.id)}
                                    title={event.title}
                                  />
                                );
                              })}
                              {dayEvents.length > 4 && (
                                <span className="text-[8px] leading-none text-charcoal/50">
                                  +{dayEvents.length - 4}
                                </span>
                              )}
                            </div>
                          )}
                          {/* Desktop: text badges */}
                          <div className="mt-0.5 space-y-0.5 hidden md:block">
                            {dayEvents.slice(0, 3).map((event) => {
                              const color = getCategoryColor(event.category);
                              return (
                                <button
                                  aria-label={`${event.title} on ${fullDate}`}
                                  className={`w-full text-left text-xs leading-tight font-medium px-1.5 py-0.5 rounded truncate ${color.bg} ${color.text} hover:opacity-80 transition-opacity cursor-pointer`}
                                  key={event.id}
                                  onClick={() => onEventClick?.(event.id)}
                                  title={event.title}
                                >
                                  {event.title}
                                </button>
                              );
                            })}
                            {(dayEvents.length > 3 || hiddenSpanning > 0) && (
                              <span
                                aria-label={`${dayEvents.length - Math.min(dayEvents.length, 3) + hiddenSpanning} more events`}
                                className="text-[10px] text-charcoal/70 px-1"
                              >
                                +{dayEvents.length - Math.min(dayEvents.length, 3) + hiddenSpanning}{' '}
                                more
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
        <div className="flex items-center gap-1.5" key={name}>
          <span
            aria-hidden="true"
            className={`inline-block w-3 h-3 rounded-full ${colors.barBg}`}
          />
          <span className="text-xs text-charcoal/70 font-medium">{name}</span>
        </div>
      ))}
    </div>
  );
}
