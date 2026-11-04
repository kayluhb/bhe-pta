import {useMemo, useState} from 'react';
import {Link, useLoaderData} from 'react-router';

import {NewsletterSignup} from '~/components/NewsletterSignup';
import {Button} from '~/components/ui/Button';
import {Container} from '~/components/ui/Container';
import {DateTile} from '~/components/ui/DateTile';
import {TagPill} from '~/components/ui/TagPill';
import {sanitizeCalendarEvents, stripHtml} from '~/lib/calendar';
import {getCloudflare} from '~/lib/cloudflare-context';
import {
  EVENT_FILTERS,
  eventMatchesFilter,
  filterIdForCategory,
  labelForCategory,
  tintForFilter,
  type EventFilterId,
} from '~/lib/event-categories';
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
    // KV not available
  }

  return {events};
}

function eventDate(start: string): Date {
  return start.includes('T') ? new Date(start) : new Date(`${start}T00:00:00`);
}

function monthKey(start: string): string {
  const d = eventDate(start);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthHeading(start: string): string {
  return eventDate(start)
    .toLocaleDateString('en-US', {month: 'long', year: 'numeric'})
    .toUpperCase();
}

function weekdayLabel(start: string): string {
  return eventDate(start).toLocaleDateString('en-US', {weekday: 'short'}).toUpperCase();
}

function dayNum(start: string): string {
  return String(eventDate(start).getDate());
}

function timeLocationLine(event: CalendarEvent): string {
  const parts: string[] = [];
  if (!event.allDay && event.start.includes('T')) {
    parts.push(
      eventDate(event.start).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
    );
  }
  if (event.description) {
    const plain = stripHtml(event.description);
    if (plain) parts.push(plain.slice(0, 80) + (plain.length > 80 ? '…' : ''));
  }
  return parts.join(' · ') || '[TIME · LOCATION]';
}

function isRsvpEvent(event: CalendarEvent): boolean {
  return eventMatchesFilter(event, 'prospective');
}

export default function EventsPage() {
  const {events} = useLoaderData<typeof loader>();
  const [filter, setFilter] = useState<EventFilterId>('all');

  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return events
      .filter((e) => eventDate(e.start) >= today)
      .filter((e) => eventMatchesFilter(e, filter))
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [events, filter]);

  const byMonth = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of upcoming) {
      const key = monthKey(event.start);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [upcoming]);

  return (
    <div className="py-12 md:py-[64px]">
      <Container>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-[42px] font-extrabold tracking-[-0.035em] text-bhe-ink md:text-[56px]">
              Events
            </h1>
            <p className="mt-3 max-w-xl text-[17px] text-bhe-body">
              PTA meetings, community gatherings, and tours for prospective families.
            </p>
          </div>
          {/* No public ICS URL confirmed — omit "Add to my calendar" rather than invent a feed */}
        </div>

        <div
          aria-label="Filter events"
          className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
          role="group"
        >
          {EVENT_FILTERS.map((chip) => {
            const pressed = filter === chip.id;
            return (
              <button
                aria-pressed={pressed}
                className={[
                  'shrink-0 rounded-full border-2 px-4 py-2.5 text-sm font-bold transition-colors',
                  pressed
                    ? 'border-bhe-green bg-bhe-green text-bhe-on-green'
                    : 'border-bhe-border-input bg-bhe-card text-bhe-ink hover:border-bhe-green',
                ].join(' ')}
                key={chip.id}
                onClick={() => setFilter(chip.id)}
                type="button"
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col gap-10 lg:flex-row">
          <div className="min-w-0 flex-[999_1_560px] space-y-10">
            {byMonth.map(([key, monthEvents]) => (
              <section key={key}>
                <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-bhe-green-2">
                  {monthHeading(monthEvents[0].start)}
                </h2>
                <ul className="mt-4 space-y-4">
                  {monthEvents.map((event) => {
                    const filterId = filterIdForCategory(event.category);
                    const tint = tintForFilter(
                      eventMatchesFilter(event, 'prospective')
                        ? 'prospective'
                        : eventMatchesFilter(event, 'pta')
                          ? 'pta'
                          : filterId,
                    );
                    return (
                      <li
                        className="flex flex-col gap-4 rounded-card border border-bhe-border bg-bhe-card p-5 sm:flex-row sm:items-center"
                        key={event.id}
                      >
                        <DateTile
                          day={dayNum(event.start)}
                          label={weekdayLabel(event.start)}
                          size="lg"
                        />
                        <div className="min-w-0 flex-1">
                          <TagPill tint={tint}>{labelForCategory(event.category)}</TagPill>
                          <h3 className="mt-2 font-display text-[22px] font-bold leading-tight text-bhe-ink md:text-[28px]">
                            {event.title}
                          </h3>
                          <p className="mt-1 text-sm text-bhe-muted">{timeLocationLine(event)}</p>
                        </div>
                        <Button
                          className="shrink-0"
                          to="/contact"
                          variant={isRsvpEvent(event) ? 'primary' : 'secondary'}
                        >
                          {isRsvpEvent(event) ? 'RSVP' : 'Details'}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
                {monthEvents.length < 3 ? (
                  <div className="mt-4 rounded-card border border-dashed border-bhe-border-input p-5 text-sm text-bhe-muted">
                    More events will be posted soon.{' '}
                    <Link className="font-bold text-bhe-green hover:underline" to="/archive">
                      Browse past events in the archive →
                    </Link>
                  </div>
                ) : null}
              </section>
            ))}

            {byMonth.length === 0 ? (
              <div className="rounded-card border border-dashed border-bhe-border-input p-8 text-bhe-muted">
                More events will be posted soon.{' '}
                <Link className="font-bold text-bhe-green hover:underline" to="/archive">
                  Browse past events in the archive →
                </Link>
              </div>
            ) : null}
          </div>

          <aside className="flex w-full flex-[1_1_300px] flex-col gap-5 lg:max-w-sm">
            <NewsletterSignup variant="sidebar" />
            <div className="rounded-card border border-bhe-border bg-bhe-card p-6">
              <h3 className="font-display text-xl font-bold text-bhe-ink">Planning an event?</h3>
              <p className="mt-2 text-sm text-bhe-muted">
                Tell the PTA about community events you&apos;d like on the calendar.
              </p>
              <a
                className="mt-4 inline-flex min-h-11 items-center font-bold text-bhe-green hover:underline"
                href="mailto:pta@bheeagles.com?subject=Submit%20an%20event"
              >
                Submit an event →
              </a>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}
